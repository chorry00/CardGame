const panel = document.querySelector('#installPanel');
const install = document.querySelector('#installApp');
const note = document.querySelector('#pwaNote');
const update = document.querySelector('#updateApp');
let promptEvent;
const standalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone;
function help() {
  if (standalone()) { panel.hidden = true; return; }
  panel.hidden = false;
  const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  note.textContent = ios
    ? 'Safariの共有メニューから「ホーム画面に追加」でアプリとして遊べます。'
    : 'ブラウザのメニューから「アプリをインストール」または「ホーム画面に追加」を選べます。';
}
help();
window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault(); promptEvent = event;
  if (!standalone()) {panel.hidden = false; install.hidden = false;}
});
install.addEventListener('click', async () => {
  if (!promptEvent) return;
  const current = promptEvent; promptEvent = null; install.hidden = true;
  await current.prompt(); await current.userChoice;
});
window.addEventListener('appinstalled', () => { promptEvent = null; panel.hidden = true; });
matchMedia('(display-mode: standalone)').addEventListener('change', help);
if ('serviceWorker' in navigator && window.isSecureContext) {
  let updating = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (updating) location.reload();
  });
  navigator.serviceWorker.register('/sw.js', {updateViaCache: 'none'}).then(registration => {
    function offerUpdate() {
      if (!registration.waiting || !navigator.serviceWorker.controller) return;
      update.hidden = false;
      update.onclick = () => {
        if (!confirm('更新して最初の画面に戻ります。進行中のゲームは終了します。よろしいですか？')) return;
        updating = true;
        registration.waiting?.postMessage({type: 'ACTIVATE_UPDATE'});
      };
    }
    offerUpdate();
    registration.addEventListener('updatefound', () => {
      registration.installing?.addEventListener('statechange', offerUpdate);
    });
    navigator.serviceWorker.ready.then(() => {
      document.querySelector('#offlineStatus').textContent = 'オフラインで遊べます';
    });
  }).catch(() => {
    document.querySelector('#offlineStatus').textContent = 'オフラインの準備に失敗しました。通信状態を確認して再読み込みしてください。';
  });
} else {
  document.querySelector('#offlineStatus').textContent = 'アプリのインストールとオフライン利用にはHTTPS接続が必要です。';
}
