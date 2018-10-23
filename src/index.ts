class EventEmitter {
  private handles: { [type: Event]: Array<() => void> } = {
    //
  };
  public on(type: Event, cb) {
    let handler = this.handles[type];
    if (!handler) {
      handler = this.handles[type] = []
    }
    handler.push(cb);
    return this;
  }
  public off(type: Event) {
    this.handles[type] = [];
    delete this.handles[type]
  }
  public emit(type: Event) {
    const handler = this.handles[type] || [];

    for (const cb of handler) {
      cb()
    }
    return this
  }
}

enum Event {
  Tap = "tap",
  Touch = "touch",
  DbTab = "dbtap",
  Longtap = "longtap",
  Slide = "slide",
  Move = "move",
  Drag = "drag",
  Swipe = "swipe",
  SwipeUp = "swipeUp",
  SwipeRight = "swipeRight",
  SwipeDown = "swipeDown",
  SwipeLeft = "swipeLeft",
  Finish = "finish",
  End = "end"
}

enum Direction {
  Null = "",
  Up = "up",
  Right = "right",
  Down = "down",
  Left = "left",
}

interface IPosition {
  x: number // x轴的位置
  y: number // y轴的位置
  timestamp: number // 时间戳
}

const DoubleTapTimeout = 300; // 双击间隔300ms
const LongTapTimeout = 800; // 长按时长800ms

export default class Gesture extends EventEmitter {
  // 需要绑定手势的对象
  private target: HTMLElement;
  // 记录刚触摸的手指
  private touch: IPosition = {x: 0, y:0, timestamp: 0};
  // 记录移动过程中变化的手指参数
  private movetouch: IPosition = {x: 0, y:0, timestamp: 0};
  // 由于会涉及到双击，需要一个记录上一次触摸的对象
  private pretouch: IPosition = {x: 0, y:0, timestamp: 0};
  // 用于触发长按的定时器
  private longTapTimeout = null;
  // 用于触发点击的定时器
  private tapTimeout = null;
  // 用于记录是否执行双击的定时器
  private doubleTap = false;

  private privateTouchstart;
  private privateTouchmove;
  private privateTouchend;
  private privateTouchcancel;

  constructor(selector: HTMLElement | string) {
    super();
    const target = this.target = selector instanceof HTMLElement ? selector : typeof selector === "string" ? document.querySelector(selector) : null; // 获取目标元素
    this.init();
    this.privateTouchstart = this.touchstart.bind(this);
    this.privateTouchmove = this.touchmove.bind(this);
    this.privateTouchend = this.touchend.bind(this);
    this.privateTouchcancel = this.touchcancel.bind(this);
    // 绑定基本事件，需要注意this的指向，事件的处理方法均在prototype实现
    target.addEventListener('touchstart', this.privateTouchstart, false);
    target.addEventListener('touchmove', this.privateTouchmove, false);
    target.addEventListener('touchend', this.privateTouchend, false);
    target.addEventListener('touchcancel', this.privateTouchcancel, false);
  }
  private touchstart(e) {
    const point = e.touches ? e.touches[0] : e;// 获得触摸参数
    const now = Date.now(); // 当前的时间
    // 记录手指位置等参数
    this.touch.x = point.pageX;
    this.touch.y = point.pageY;
    this.touch.timestamp = now;
    // 由于会有多次触摸的情况，单击事件和双击针对单次触摸，故先清空定时器
    if (this.longTapTimeout) {
      clearTimeout(this.longTapTimeout);
    }
    if (this.tapTimeout) {
      clearTimeout(this.tapTimeout);
    }
    this.emit(Event.Touch); // 执行原生的touchstart回调，emit为执行的方法，后面定义
    if (e.touches.length > 1) {
      // 这里为处理多个手指触摸的情况
    } else {
      // 按下800毫秒，则为长按
      this.longTapTimeout = setTimeout(() => {// 手指触摸后立即开启长按定时器，800ms后执行
        this.emit(Event.Longtap);// 执行长按回调
        e.preventDefault(); // 阻止长按的默认行为
      }, LongTapTimeout);
      // 按照上面分析的思路计算当前是否处于双击状态
      const MAX_DOUBLETAP_DIFF = 30; // 最大偏移量，超过这个偏移量则不认为是双击
      this.doubleTap =
        this.pretouch.timestamp && now - this.pretouch.timestamp < DoubleTapTimeout && // 距离上一次时间间隔小于300ms
        Math.abs(this.touch.x - this.pretouch.x) < MAX_DOUBLETAP_DIFF && // X轴偏移量不超过30
        Math.abs(this.touch.y - this.pretouch.y) < MAX_DOUBLETAP_DIFF && // Y轴偏移量不超过30
        Math.abs(this.touch.timestamp - this.pretouch.timestamp) < DoubleTapTimeout;
      this.pretouch = {// 更新上一个触摸的信息为当前，供下一次触摸使用
        x: this.touch.x,
        y: this.touch.x,
        timestamp: this.touch.timestamp
      };
    }
  }
  private touchmove(e: TouchEvent) {
    const point = e.touches[0];
    this.emit(Event.Move);// 原生的 touchmove 事件回调
    if (e.touches.length > 1) {// multi touch
      // 多个手指触摸的情况
    } else {
      const diffX: number = point.pageX - this.touch.x; // 与手指触摸时的x轴偏移量
      const diffY: number = point.pageY - this.touch.y; // 与手指触摸时的y轴偏移量
      const MIN_MOVE_DIFF = 30; // 如果移动超过30个像素，就不是长按和双击
      // 当手指划过的距离超过了30，所有单手指非滑动事件取消
      if (Math.abs(diffX) > MIN_MOVE_DIFF || Math.abs(diffY) > MIN_MOVE_DIFF) {
        if (this.longTapTimeout) {
          clearTimeout(this.longTapTimeout);
        }
        if (this.tapTimeout) {
          clearTimeout(this.tapTimeout);
        }
        this.emit(Event.Slide); // 触发滑动事件
      }
      // 更新移动中的手指参数
      this.movetouch.x = point.pageX;
      this.movetouch.y = point.pageY;
    }
  }
  private touchend(e) {
    if (this.longTapTimeout) {
      clearTimeout(this.longTapTimeout); // 手指离开了，就要取消长按事件
    }
    const timestamp = Date.now();
    const deltaX = (this.movetouch.x || 0) - this.touch.x;
    const deltaY = (this.movetouch.y || 0) - this.touch.y;
    if (this.movetouch.x && (Math.abs(deltaX) > 30 || this.movetouch.y !== null && Math.abs(deltaY) > 30)) {// swipe手势
      if (Math.abs(deltaX) < Math.abs(deltaY)) {
        if (deltaY < 0) {// 上划
          this.emit(Event.SwipeUp);
        } else { // 下划
          this.emit(Event.SwipeDown);
        }
      } else {
        if (deltaX < 0) { // 左划
          this.emit(Event.SwipeLeft);
        } else { // 右划
          this.emit(Event.SwipeRight);
        }
      }
      this.emit(Event.Swipe); // 划
    } else {
      if (!this.doubleTap && timestamp - this.touch.timestamp < 300) {// 单次点击300ms内离开，触发点击事件
        this.tapTimeout = setTimeout(() => {
          this.emit(Event.Tap);
          this.emit(Event.Finish);// 事件处理完的回调
        }, 300)
      } else if (this.doubleTap) {// 300ms内再次点击且离开，则触发双击事件，不触发单击事件
        this.emit(Event.DbTab);
        if (this.tapTimeout) {
          clearTimeout(this.tapTimeout);
        }
        this.emit(Event.Finish);
      } else {
        this.emit(Event.Finish);
      }
    }
    this.emit(Event.End); // 原生的touchend事件
  }
  private touchcancel(e) {
    //
  }
  private init() {
    this.touch = {x: 0, y: 0, timestamp: 0};
    this.movetouch = {x: 0, y: 0, timestamp: 0};
  }
  public destroy() {
    if (this.longTapTimeout) {
      clearTimeout(this.longTapTimeout)
    }
    if (this.tapTimeout) {
      clearTimeout(this.tapTimeout)
    }
    const target = this.target;
    target.removeEventListener('touchstart', this.privateTouchstart);
    target.removeEventListener('touchmove', this.privateTouchmove);
    target.removeEventListener('touchend', this.privateTouchend);
    target.removeEventListener('touchcancel', this.privateTouchcancel);
    return false;
  }
}
