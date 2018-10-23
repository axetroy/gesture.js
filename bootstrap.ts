import Gesture from './src/index'

const instance = new Gesture('#target')
  .on('tap', () => {
    console.log('你进行了单击操作');
  })
  .on('longtap', () => {
    console.log('长按操作');
  })
  .on('dbtap', () => {
    console.log('你触发了双击');
  })
  .on('slide', () => {
    console.log('slide')
  })
  .on('swipeUp', () => {
    console.log('你进行了上滑')
  })
  .on('swipeDown', () => {
    console.log('你进行了下滑')
  })
  .on('swipeLeft', () => {
    console.log('你进行了左滑')
  })
  .on('swipeRight', () => {
    console.log('你进行了右滑')
    console.log(instance)
  })