import Gesture from './src/index'

function log (message) {
  const $log = document.getElementById('logs');
  const item = document.createElement('p');
  item.innerHTML = new Date().toLocaleString() + ':' +message;
  $log.insertBefore(item, $log.children[0])
}

const instance = new Gesture('#target')
  .on('tap', () => {
    log('你进行了单击操作');
  })
  .on('longtap', () => {
    log('长按操作');
  })
  .on('dbtap', () => {
    log('你触发了双击');
  })
  .on('slide', () => {
    // log('slide')
  })
  .on('swipeUp', () => {
    log('你进行了上滑')
  })
  .on('swipeDown', () => {
    log('你进行了下滑')
  })
  .on('swipeLeft', () => {
    log('你进行了左滑')
  })
  .on('swipeRight', () => {
    log('你进行了右滑')
  })