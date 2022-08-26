import {
  Component,
  OnDestroy,
  PLATFORM_ID,
  Inject,
  ViewChild,
  ElementRef,
} from '@angular/core';

import {
  of,
  from,
  Observable,
  Subject,
  BehaviorSubject,
  throwError,
} from 'rxjs';
import { map, tap, delay, switchMap } from 'rxjs/operators';

import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'my-app',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnDestroy {
  /**
   * getUserMedia initiates greenlight immediately after permission
   * greenlight still shows even if no tracks are live
   * eventually greenlight will shut if no stream
   */
  @ViewChild('video', { static: true }) video: ElementRef<HTMLVideoElement>;
  private vidStream = new BehaviorSubject<MediaStream | undefined>(undefined);

  constructor(@Inject(PLATFORM_ID) private _platform: Object) {}

  getUserPermission(): Promise<MediaStream> {
    return navigator.mediaDevices.getUserMedia({ video: true });
  }

  getVideoStream(): Observable<MediaStream> {
    return from(this.getUserPermission()).pipe(
      map((stream: MediaStream) => stream)
    );
  }

  playVideo() {
    return this.getVideoStream().subscribe((stream) => {
      const _video: HTMLVideoElement = this.video.nativeElement;
      this.vidStream.next(stream);
      _video.srcObject = stream;
      _video.play();
    });
  }

  stopVideo() {
    // (this.video.nativeElement.srcObject as MediaStream)
    //   .getVideoTracks()[0]
    //   .stop();
    // this.video.nativeElement.srcObject = null;
    // this.vidStream.next(undefined);

    const stream = this.vidStream.getValue();
    const isLive = stream.getTracks().some((t) => {
      t.readyState === 'live';
    });
    console.log('is live stream', isLive);
    console.log('length of stream ', stream.getTracks().length);
    stream.getTracks().map((elem) => console.log(elem.readyState));
    stream
      .getTracks()
      .map((stream) => console.log('overall state of stream ', stream));
  }

  liveStreams(): Observable<MediaStream> {
    return this.vidStream;
  }

  justRequestPermission() {
    return from(this.getUserPermission());
  }

  ngOnInit() {
    // TEST
    // Does error after requesting permission affect webcam greenlight?
    // throw error doesn't affect webcam permission
    /** 
     this.justRequestPermission()
      .pipe(
        delay(100),
        switchMap((stream) => {
          return throwError('abort');
        })
      )
      .subscribe();
    **/

    // Test
    // Does webcam light shut off if no active/live tracks? YES
    // how about just stop it altogether
    // seems to take seconds for light to go off, even
    // if stop() is called immediately
    this.justRequestPermission()
      .pipe((stream) => stream)
      .subscribe((stream) => {
        console.log('streaming');
        stream.getTracks().map((track) => track.stop());
      });

    // this.playVideo();
    // this.onStart();
    // this.liveStreams()
    //   .pipe(tap(console.log))
    //   .subscribe((stream) => console.log('im streaming!', stream));
  }

  onStart() {
    console.log('onstart');
    if (isPlatformBrowser(this._platform) && 'mediaDevices' in navigator) {
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((ms: MediaStream) => {
          const _video = this.video.nativeElement;
          _video.srcObject = ms;
          _video.play();
        });
    }
  }

  onStop() {
    console.log('on stop');
    this.video.nativeElement.pause();
    (this.video.nativeElement.srcObject as MediaStream)
      .getVideoTracks()[0]
      .stop();
    this.video.nativeElement.srcObject = null;
  }

  ngOnDestroy() {
    (this.video.nativeElement.srcObject as MediaStream)
      .getVideoTracks()[0]
      .stop();
  }
}
