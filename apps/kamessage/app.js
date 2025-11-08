// ===================================
// HTML要素の取得
// ===================================
const loginContainer = document.getElementById('login-container');
const mainWrapper = document.getElementById('main-wrapper');
const usernameInput = document.getElementById('username-input');
const passwordInput = document.getElementById('password-input');
const loginButton = document.getElementById('login-button');
const signupButton = document.getElementById('signup-button');

const newChatButton = document.getElementById('new-chat-button');
const userList = document.getElementById('user-list');
const chatContainer = document.getElementById('chat-view-container');
const chatTitle = document.getElementById('chat-title');
const messageList = document.getElementById('message-list');
const messageForm = document.getElementById('message-form');
const messageInput = document.getElementById('message-input');
const logoutButton = document.getElementById('logout-button');

let currentChatId = null;
let messageListener = null; // メッセージのリスナーを管理するための変数

// ===================================
// ログイン状態の監視
// ===================================
auth.onAuthStateChanged(user => {
    if (user) {
        loginContainer.classList.add('hidden');
        mainWrapper.classList.remove('hidden');
        loadUserChats();
    } else {
        loginContainer.classList.remove('hidden');
        mainWrapper.classList.add('hidden');
        currentChatId = null;
        if (messageListener) {
            messageListener.off(); // ログアウト時にリスナーを解除
        }
    }
});

// ===================================
// イベントリスナー
// ===================================
signupButton.addEventListener('click', () => {
    const username = usernameInput.value.trim();
    const password = passwordInput.value;
    if (!username || !password) {
        return alert("IDとパスワードを入力してください");
    }
    const email = username + '@account.matcha-kame.com';
    auth.createUserWithEmailAndPassword(email, password)
        .catch(error => { alert('エラー: ' + error.message); });
});

loginButton.addEventListener('click', () => {
    const username = usernameInput.value.trim();
    const password = passwordInput.value;
    if (!username || !password) {
        return alert("IDとパスワードを入力してください");
    }
    const email = username + '@account.matcha-kame.com';
    auth.signInWithEmailAndPassword(email, password)
        .catch(error => { alert('エラー: ' + error.message); });
});

logoutButton.addEventListener('click', () => {
    auth.signOut();
});

newChatButton.addEventListener('click', () => {
    const targetUsername = prompt("会話したい相手のIDを入力してください (例: taro)");
    if (!targetUsername) return;

    const currentUserEmail = auth.currentUser.email;
    const targetUserEmail = targetUsername.trim() + '@account.matcha-kame.com';
    
    if (currentUserEmail === targetUserEmail) {
        return alert("自分自身とチャットはできません。");
    }

    // 相手が存在するかチェック (簡易的)
    db.ref('users').orderByChild('email').equalTo(targetUserEmail).once('value', snapshot => {
        if (!snapshot.exists()) {
            return alert('エラー: そのIDのユーザーは見つかりませんでした。');
        }
        
        const targetUid = Object.keys(snapshot.val())[0];
        const targetUserData = snapshot.val()[targetUid];

        const chatId = [auth.currentUser.uid, targetUid].sort().join('_');
        createChatRoom(chatId, currentUserEmail, targetUserEmail, targetUid);
    });
});

messageForm.addEventListener('submit', event => {
    event.preventDefault();
    const messageText = messageInput.value.trim();
    if (messageText !== '' && currentChatId) {
        db.ref(`chats/${currentChatId}/messages`).push({
            sender: auth.currentUser.email,
            text: messageText,
            timestamp: firebase.database.ServerValue.TIMESTAMP
        });
        messageInput.value = '';
    }
});

// ===================================
// 関数
// ===================================
function loadUserChats() {
    const userChatsRef = db.ref(`user_chats/${auth.currentUser.uid}`);
    userChatsRef.on('value', snapshot => {
        userList.innerHTML = '';
        if (snapshot.exists()) {
            snapshot.forEach(childSnapshot => {
                displayChatItem(childSnapshot.val(), childSnapshot.key);
            });
        } else {
            userList.innerHTML = '<p class="no-chats">まだトークがありません。「＋」から新しいトークを始めよう！</p>';
        }
    });
}

function displayChatItem(chatData, chatId) {
    const partnerEmail = chatData.members.find(email => email !== auth.currentUser.email);
    const partnerUsername = partnerEmail.split('@')[0];
    const item = document.createElement('div');
    item.className = 'user-item';
    item.dataset.chatId = chatId;
    item.innerHTML = `
        <div class="avatar">👤</div>
        <div class="user-info">
            <div class="username">${partnerUsername}</div>
            <div class="last-message">...</div>
        </div>
    `;
    item.addEventListener('click', () => {
        openChatRoom(chatId, partnerUsername);
    });
    userList.appendChild(item);
}

function openChatRoom(chatId, partnerUsername) {
    currentChatId = chatId;
    chatTitle.textContent = `${partnerUsername}とのトーク`;
    messageList.innerHTML = '';
    
    document.querySelectorAll('.user-item').forEach(item => item.classList.remove('active'));
    const activeItem = document.querySelector(`.user-item[data-chat-id="${chatId}"]`);
    if(activeItem) activeItem.classList.add('active');

    if (messageListener) {
        messageListener.off(); // 前のリスナーを解除
    }
    
    messageListener = db.ref(`chats/${currentChatId}/messages`).orderByChild('timestamp');
    messageListener.on('child_added', snapshot => {
        const data = snapshot.val();
        addMessageToScreen(data.text, data.sender);
    });
}

function createChatRoom(chatId, currentUserEmail, targetUserEmail, targetUid) {
    const chatRef = db.ref(`chats/${chatId}`);
    chatRef.set({
        members: [currentUserEmail, targetUserEmail],
        createdAt: firebase.database.ServerValue.TIMESTAMP
    });
    
    db.ref(`user_chats/${auth.currentUser.uid}/${chatId}`).set({
        members: [currentUserEmail, targetUserEmail]
    });

    db.ref(`user_chats/${targetUid}/${chatId}`).set({
        members: [currentUserEmail, targetUserEmail]
    });

    // ユーザー情報を保存する（相手の存在チェックに使う）
    db.ref(`users/${auth.currentUser.uid}`).set({
        email: currentUserEmail
    });

    openChatRoom(chatId, targetUserEmail.split('@')[0]);
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