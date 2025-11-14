// ===================================
// HTML要素の取得
// ===================================
const authContainer = document.getElementById('auth-container');
const loginModal = document.getElementById('login-modal');
const closeModalButton = document.getElementById('close-modal-button');
const modalOverlay = document.getElementById('modal-overlay');
const loginForm = document.getElementById('login-form');
const modalUsernameInput = document.getElementById('modal-username-input');
const modalPasswordInput = document.getElementById('modal-password-input');
const modalSubmitButton = document.getElementById('modal-submit-button');
const modalTitle = document.getElementById('modal-title');
const modalDomainDisplay = document.getElementById('modal-domain-display');
const modalToggleContainer = document.getElementById('modal-toggle-container');
const modalToggleText = document.getElementById('modal-toggle-text');
const modalToggleButton = document.getElementById('modal-toggle-button');

let isLoginMode = true;

// ===================================
// UIを更新する関数
// ===================================
function updateModalUI() {
    if (isLoginMode) {
        modalTitle.textContent = 'まっちゃアカウント';
        modalDomainDisplay.classList.add('hidden');
        modalSubmitButton.textContent = 'ログイン';
        modalToggleText.textContent = 'アカウントがない場合はこちら';
        modalToggleButton.textContent = 'アカウント作成';
    } else {
        modalTitle.textContent = 'アカウント作成';
        modalDomainDisplay.classList.remove('hidden');
        modalSubmitButton.textContent = 'アカウント作成';
        modalToggleText.textContent = '既にアカウントをお持ちの場合はこちら';
        modalToggleButton.textContent = 'ログイン';
    }
}

// ===================================
// モーダルの表示・非表示
// ===================================
function openModal() {
    isLoginMode = true;
    updateModalUI();
    loginModal.classList.remove('hidden');
}

function closeModal() {
    loginModal.classList.add('hidden');
}

// ===================================
// ★★★ まっちゃアカウント連携機能 ★★★
// ===================================
document.addEventListener('DOMContentLoaded', () => {
    // ログイン状態を監視
    auth.onAuthStateChanged(user => {
        if (user) {
            const username = user.email.split('@')[0];
            authContainer.innerHTML = `
                <div class="text-right">
                    <p class="font-semibold text-gray-700">ようこそ、${username}さん</p>
                    <button id="logout-button" class="text-blue-600 hover:underline">ログアウト</button>
                </div>
            `;
            document.getElementById('logout-button').addEventListener('click', () => auth.signOut());
        } else {
            authContainer.innerHTML = `
                <button id="open-login-modal-button" class="bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700">
                    ログイン / 新規登録
                </button>
            `;
            document.getElementById('open-login-modal-button').addEventListener('click', openModal);
        }
    });

    // モーダルのイベントリスナーを設定
    closeModalButton.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', closeModal);
    modalToggleButton.addEventListener('click', () => {
        isLoginMode = !isLoginMode;
        updateModalUI();
    });

    // フォーム送信時の処理
    loginForm.addEventListener('submit', (event) => {
        event.preventDefault(); // ページがリロードされるのを防ぐ
        
        const username = modalUsernameInput.value;
        const password = modalPasswordInput.value;
        const email = username.trim() + '@account.matcha-kame.com';

        if (isLoginMode) {
            // ログイン処理
            auth.signInWithEmailAndPassword(email, password)
                .then(() => {
                    console.log("ログイン成功！");
                    closeModal();
                })
                .catch(error => alert("ログイン失敗: " + error.message));
        } else {
            // アカウント作成処理
            auth.createUserWithEmailAndPassword(email, password)
                .then(() => {
                    console.log("アカウント作成成功！");
                    closeModal();
                })
                .catch(error => alert("アカウント作成失敗: " + error.message));
        }
    });
});
