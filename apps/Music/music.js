// ===================================
// HTML要素の取得
// ===================================
const songListContainer = document.getElementById('song-list');
const audioPlayer = document.getElementById('audio-player');
const playPauseButton = document.getElementById('play-pause-button');
const progressBar = document.getElementById('progress-bar');
const currentTimeDisplay = document.getElementById('current-time');
const totalDurationDisplay = document.getElementById('total-duration');
const currentSongTitle = document.getElementById('current-song-title');
const currentSongArtist = document.getElementById('current-song-artist');
const lyricsDisplay = document.getElementById('lyrics-display');


// ===================================
// ★★★ 曲のリスト ★★★
// ここを君のMP3ファイルの情報に書き換えるんだ！
// ===================================
const songs = [
    {
        title: '歌詞と音源が噛み合ってません',
        artist: 'こうしろう',
        filePath: 'music/song1.mp3',
        lyrics: `1番 りくとが私にくれたもの
まじで無駄すぎるあの贅肉
りくとが私にくれたもの
どこでも本を読むメンタル
本が汚くなるー
からまじでやめてほしい
本を弁償してー
罪を償って欲しい
まじでデブすぎるりくと
みんなも話してみてー

〜2番〜 りくとが私にくれたもの
人を殺そうと思った（おもた）事
りくとが私にくれたもの
まじで臭すぎる唾液と息
周り汚染されるー
からまじでやめて欲しいー
環境破壊もー 甚だしい（はなはだしい）
マジでゴミすぎるりくと
みんなも殺してみてー

〜ラスト〜 りくとが私にくれたもの
マジでイラつくあの口調
りくとが私にくれたもの
マジでキモすぎるあの顔面
から周りのみんな吐くー
みんなが飼ってる
ペットも吐くー
チビでハゲデブーりくと
みんなも殺したいねー

〜幻の4番〜 りくとが私にくれたもの
笑った顔が金正恩 りくとが私にくれたもの
マジでキモすぎるその全体
ほんとにキモすぎるー
から周りの批准ー
りくとそーれー
全力で否定ー
ゴミ×8りくと！
 早く死んでください（言葉濁）`
    },
    // 他にも曲があれば、この下のコメントを外して追加する！
    // {
    //     title: '亀のバラード',
    //     artist: 'Matcha Singers',
    //     filePath: 'music/banger.mp3',
    //     lyrics: `ここに2曲目の歌詞を書く`
    // },
];

let currentSongIndex = 0;


// ===================================
// 曲リストを画面に表示する
// ===================================
function renderSongList() {
    songListContainer.innerHTML = '';
    songs.forEach((song, index) => {
        const songItem = document.createElement('div');
        songItem.className = 'song-item';
        songItem.innerHTML = `
            <div class="song-play-icon">▶</div>
            <div class="song-details">
                <div class="song-title">${song.title}</div>
                <div class="song-artist">${song.artist}</div>
            </div>
            <div class="song-duration">--:--</div>
        `;
        songItem.addEventListener('click', () => {
            loadSong(index);
            playSong();
        });
        songListContainer.appendChild(songItem);
    });
}


// ===================================
// 音楽プレイヤーの機能
// ===================================
function loadSong(index) {
    currentSongIndex = index;
    const song = songs[index];
    audioPlayer.src = song.filePath;
    currentSongTitle.textContent = song.title;
    currentSongArtist.textContent = song.artist;
    if (song.lyrics) {
        lyricsDisplay.textContent = song.lyrics;
    } else {
        lyricsDisplay.textContent = 'この曲には歌詞が登録されていません。';
    }
}

function playSong() {
    audioPlayer.play();
    playPauseButton.textContent = '||';
}

function pauseSong() {
    audioPlayer.pause();
    playPauseButton.textContent = '▶';
}

playPauseButton.addEventListener('click', () => {
    if (audioPlayer.src && !audioPlayer.paused) {
        pauseSong();
    } else {
        playSong();
    }
});

audioPlayer.addEventListener('timeupdate', () => {
    const { currentTime, duration } = audioPlayer;
    progressBar.value = (currentTime / duration) * 100 || 0;
    currentTimeDisplay.textContent = formatTime(currentTime);
    if(duration) totalDurationDisplay.textContent = formatTime(duration);
});

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

progressBar.addEventListener('input', () => {
    if(audioPlayer.duration) {
        audioPlayer.currentTime = (progressBar.value / 100) * audioPlayer.duration;
    }
});


// ===================================
// 最初の処理
// ===================================
if (songs && songs.length > 0) {
    renderSongList();
    loadSong(0);
} else {
    songListContainer.innerHTML = '<p>曲が登録されていません。music.jsファイルを編集してください。</p>';
}