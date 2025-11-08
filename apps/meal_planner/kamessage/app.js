// ===================================
// HTML要素の取得
// ===================================
const loginContainer = document.getElementById('login-container');
const chatContainer = document.getElementById('chat-container');

// ▼▼▼▼▼▼▼▼▼▼ ここを改造したぞ！ ▼▼▼▼▼▼▼▼▼▼
const usernameInput = document.getElementById('username-input'); // email-inputから変更
const passwordInput = document.getElementById('password-input');
const loginButton = document.getElementById('login-button');
const signupButton = document.getElementById('signup-button');
const logoutButton = document.getElementById('logout-button');
// ▲▲▲▲▲▲▲▲▲▲ ここまで ▲▲▲▲▲▲▲▲▲▲

const messageForm = document.getElementById('message-form');
const messageInput = document.getElementById('message-input');
const messageList = document.getElementById('message-list');
const chatTitle = document.getElementById('chat-title');


// ===================================
// ログイン状態の監視 (変更なし)
// ===================================
auth.onAuthStateChanged(user => {
    if (user) {
        console.log('ログイン中:', user.email);
        loginContainer.classList.add('hidden');
        chatContainer.classList.remove('hidden');
        chatTitle.textContent = `🐢 ${user.email}`;
        messageList.innerHTML = '';
        loadMessages();
    } else {
        console.log('ログアウト中');
        loginContainer.classList.remove('hidden');
        chatContainer.classList.add('hidden');
    }
});


// ===================================
// イベントリスナーの設定
// ===================================

// 【アカウント作成】ボタンが押された時
signupButton.addEventListener('click', () => {
    // ▼▼▼▼▼▼▼▼▼▼ ここを改造したぞ！ ▼▼▼▼▼▼▼▼▼▼
    const username = usernameInput.value;
    const password = passwordInput.value;
    const email = username + '@account.matcha-kame.com'; // ユーザー名とドメインを合体！

    auth.createUserWithEmailAndPassword(email, password)
        .then(userCredential => {
            console.log('アカウント作成成功！', userCredential.user.email);
        })
        .catch(error => {
            alert('エラー: ' + error.message);
        });
    // ▲▲▲▲▲▲▲▲▲▲ ここまで ▲▲▲▲▲▲▲▲▲▲
});

// 【ログイン】ボタンが押された時
loginButton.addEventListener('click', () => {
    // ▼▼▼▼▼▼▼▼▼▼ ここを改造したぞ！ ▼▼▼▼▼▼▼▼▼▼
    const username = usernameInput.value;
    const password = passwordInput.value;
    const email = username + '@account.matcha-kame.com'; // ユーザー名とドメインを合体！

    auth.signInWithEmailAndPassword(email, password)
        .then(userCredential => {
            console.log('ログイン成功！', userCredential.user.email);
        })
        .catch(error => {
            alert('エラー: ' + error.message);
        });
    // ▲▲▲▲▲▲▲▲▲▲ ここまで ▲▲▲▲▲▲▲▲▲▲
});

// 【ログアウト】ボタンが押された時 (変更なし)
logoutButton.addEventListener('click', () => {
    auth.signOut();
});

// 【メッセージ送信】フォームが送信された時 (変更なし)
messageForm.addEventListener('submit', event => {
    event.preventDefault();
    const messageText = messageInput.value.trim();
    if (messageText !== '' && auth.currentUser) {
        db.ref('messages').push({
            sender: auth.currentUser.email,
            text: messageText,
            timestamp: Date.now()
        });
        messageInput.value = '';
    }
});


// ===================================
// 関数 (変更なし)
// ===================================

function loadMessages() {
    db.ref('messages').orderByChild('timestamp').on('child_added', snapshot => {
        const data = snapshot.val();
        addMessageToScreen(data.text, data.sender);
    });
}

function addMessageToScreen(text, sender) {
    const messageElement = document.createElement('div');
    const bubbleElement = document.createElement('div');
    if (auth.currentUser && sender === auth.currentUser.email) {
        messageElement.classList.add('message', 'sent');
    } else {
        messageElement.classList.add('message', 'received');
    }
    bubbleElement.classList.add('bubble');
    bubbleElement.textContent = text; 
    messageElement.appendChild(bubbleElement);
    messageList.appendChild(messageElement);
    messageList.scrollTop = messageList.scrollHeight;
}