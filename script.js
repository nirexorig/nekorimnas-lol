/**
 * guns.lol-style Profile Page
 * With Discord Integration via Lanyard API
 */

// ========================================
// DOM Elements
// ========================================
const gate = document.getElementById('gate');
const mainContainer = document.getElementById('mainContainer');
const profileCard = document.getElementById('profileCard');
const customCursor = document.getElementById('customCursor');
const snowContainer = document.getElementById('snowContainer');
const rainContainer = document.getElementById('rainContainer');
const crtOverlay = document.getElementById('crtOverlay');
const noiseOverlay = document.getElementById('noiseOverlay');
const audioPlayer = document.getElementById('audioPlayer');
const playBtn = document.getElementById('playBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const progressBar = document.getElementById('progressBar');
const progressFill = document.getElementById('progressFill');
const currentTimeEl = document.getElementById('currentTime');
const totalTimeEl = document.getElementById('totalTime');
const musicTitle = document.getElementById('musicTitle');
const typewriterEl = document.getElementById('typewriter');

// ========================================
// State
// ========================================
let isPlaying = false;
let currentTrackIndex = 0;
let hasEntered = false;
let playlist = [];
let discordData = null;
let useVideoAudio = false; // Использовать аудио из видео если нет музыки

// ========================================
// Initialize
// ========================================
document.addEventListener('DOMContentLoaded', async () => {
    await fetchDiscordPresence();
    await initializeAssets();
    initializeProfile();
    initializeCursor();
    initializeEffects();
    initializeGate();
    initializeTiltEffect();
    initializeTypewriter();
    await scanMusicFolder();
    initializeMusicPlayer();
});

// ========================================
// Discord Presence via Lanyard API
// ========================================
async function fetchDiscordPresence() {
    if (!CONFIG.discordUserId) return;

    try {
        const response = await fetch(`https://api.lanyard.rest/v1/users/${CONFIG.discordUserId}`);
        const data = await response.json();

        if (data.success) {
            discordData = data.data;
            console.log('Discord data loaded:', discordData);
        }
    } catch (error) {
        console.log('Could not fetch Discord presence:', error);
    }
}

function applyDiscordData() {
    if (!discordData) return;

    // Аватар Discord
    const avatar = document.getElementById('avatar');
    const discordAvatar = document.getElementById('discordAvatar');

    if (discordData.discord_user.avatar) {
        const avatarUrl = `https://cdn.discordapp.com/avatars/${discordData.discord_user.id}/${discordData.discord_user.avatar}.${discordData.discord_user.avatar.startsWith('a_') ? 'gif' : 'png'}?size=256`;
        avatar.src = avatarUrl;
        discordAvatar.src = avatarUrl;
    }

    // Имя пользователя
    const discordName = document.getElementById('discordName');
    discordName.textContent = discordData.discord_user.display_name || discordData.discord_user.username;

    // Статус онлайн
    const statusIndicator = document.getElementById('statusIndicator');
    statusIndicator.className = 'status-indicator';

    switch (discordData.discord_status) {
        case 'online':
            statusIndicator.classList.add('online');
            break;
        case 'idle':
            statusIndicator.classList.add('idle');
            break;
        case 'dnd':
            statusIndicator.classList.add('dnd');
            break;
        default:
            statusIndicator.classList.add('offline');
    }

    // Статус текст
    const discordStatus = document.getElementById('discordStatus');
    if (discordData.discord_status === 'online') {
        discordStatus.textContent = 'Online';
    } else if (discordData.discord_status === 'idle') {
        discordStatus.textContent = 'Idle';
    } else if (discordData.discord_status === 'dnd') {
        discordStatus.textContent = 'Do Not Disturb';
    } else {
        discordStatus.textContent = 'Offline';
    }

    // Активность (игра/Spotify)
    if (discordData.activities && discordData.activities.length > 0) {
        const activity = discordData.activities.find(a => a.type === 0) || discordData.activities[0];
        if (activity && activity.name) {
            discordStatus.textContent = `Playing ${activity.name}`;
        }
    }

    // Spotify
    if (discordData.listening_to_spotify && discordData.spotify) {
        discordStatus.textContent = `🎵 ${discordData.spotify.song} - ${discordData.spotify.artist}`;
    }
}

// ========================================
// Load Assets
// ========================================
async function initializeAssets() {
    const avatar = document.getElementById('avatar');
    const discordAvatar = document.getElementById('discordAvatar');
    const avatarDecoration = document.getElementById('avatarDecoration');
    const bgImage = document.getElementById('bgImage');
    const bgVideo = document.getElementById('bgVideo');
    const serverIcon = document.getElementById('serverIcon');
    const clanIcon = document.getElementById('clanIcon');

    // Применяем данные Discord если есть
    if (discordData) {
        applyDiscordData();
    }

    // Аватар fallbacks
    avatar.onerror = () => {
        avatar.src = 'assets/avatar.png';
        avatar.onerror = () => {
            avatar.src = 'https://i.pravatar.cc/150?img=3';
        };
    };

    discordAvatar.onerror = () => {
        discordAvatar.src = avatar.src;
    };

    // Декорация аватара
    if (avatarDecoration) {
        avatarDecoration.style.display = 'none';
        const testImg = new Image();
        testImg.onload = () => {
            avatarDecoration.style.display = 'block';
        };
        testImg.src = 'assets/avatar-decoration.gif';
        testImg.onerror = () => {
            const testPng = new Image();
            testPng.onload = () => {
                avatarDecoration.src = 'assets/avatar-decoration.png';
                avatarDecoration.style.display = 'block';
            };
            testPng.src = 'assets/avatar-decoration.png';
        };
    }

    // Иконки
    if (serverIcon) {
        serverIcon.style.display = 'none';
        const testIcon = new Image();
        testIcon.onload = () => serverIcon.style.display = 'block';
        testIcon.src = 'assets/server-icon.png';
    }

    if (clanIcon) {
        clanIcon.style.display = 'none';
        const testClan = new Image();
        testClan.onload = () => clanIcon.style.display = 'inline';
        testClan.src = 'assets/clan-icon.png';
    }

    // Видео-фон
    if (CONFIG.design.backgroundVideo) {
        bgVideo.src = 'assets/background.mp4';
        bgVideo.style.display = 'block';
        bgImage.style.display = 'none';
        bgVideo.addEventListener('loadeddata', () => bgVideo.play().catch(() => { }));
        bgVideo.onerror = () => {
            bgVideo.style.display = 'none';
            bgImage.style.display = 'block';
        };
    } else {
        bgImage.onerror = () => {
            bgImage.src = 'assets/background.png';
            bgImage.onerror = () => {
                bgImage.src = 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?w=1920';
            };
        };
    }
}

// ========================================
// Music Playlist - с проверкой и fallback на видео
// ========================================
async function scanMusicFolder() {
    if (CONFIG.music.playlist && CONFIG.music.playlist.length > 0) {
        // Проверяем каждый трек на доступность
        const validTracks = [];

        for (const track of CONFIG.music.playlist) {
            const url = track.file ? `assets/${track.file}` : track.url;
            const isValid = await checkAudioExists(url);

            if (isValid) {
                validTracks.push({
                    title: track.title,
                    url: url
                });
            }
        }

        playlist = validTracks;
    }

    // Если нет валидных треков и есть видео-фон - используем его аудио
    if (playlist.length === 0 && CONFIG.design.backgroundVideo) {
        const bgVideo = document.getElementById('bgVideo');
        if (bgVideo && bgVideo.src) {
            useVideoAudio = true;
            playlist = [{
                title: 'Background Audio',
                url: 'video' // Специальный маркер для видео
            }];
            console.log('No music found, using background video audio');
        }
    }
}

// Проверка существования аудио файла
function checkAudioExists(url) {
    return new Promise((resolve) => {
        // Для внешних URL пропускаем проверку
        if (url.startsWith('http')) {
            resolve(true);
            return;
        }

        const audio = new Audio();
        audio.preload = 'metadata';

        const timeout = setTimeout(() => {
            resolve(false);
        }, 3000);

        audio.onloadedmetadata = () => {
            clearTimeout(timeout);
            resolve(true);
        };

        audio.onerror = () => {
            clearTimeout(timeout);
            resolve(false);
        };

        audio.src = url;
    });
}

// ========================================
// Profile Initialization
// ========================================
function initializeProfile() {
    // Применяем настройки из конфига (если Discord не загружен)
    if (!discordData) {
        if (CONFIG.profile.username) {
            document.getElementById('discordName').textContent = CONFIG.profile.username;
        }

        const statusIndicator = document.getElementById('statusIndicator');
        statusIndicator.className = 'status-indicator';
        if (CONFIG.profile.onlineStatus) {
            statusIndicator.classList.add(CONFIG.profile.onlineStatus);
        }

        if (CONFIG.profile.status) {
            document.getElementById('discordStatus').textContent = CONFIG.profile.status;
        }
    }

    if (CONFIG.profile.location) {
        document.getElementById('location').textContent = CONFIG.profile.location;
    }
    if (CONFIG.profile.viewCount) {
        document.getElementById('viewCount').textContent = CONFIG.profile.viewCount;
    }
    if (CONFIG.profile.clan) {
        document.getElementById('clanName').textContent = CONFIG.profile.clan;
    }

    // Discord сервер
    if (CONFIG.discord.serverName) {
        document.getElementById('serverName').textContent = CONFIG.discord.serverName;
    }
    if (CONFIG.discord.onlineCount) {
        document.getElementById('onlineCount').textContent = CONFIG.discord.onlineCount;
    }
    if (CONFIG.discord.memberCount) {
        document.getElementById('memberCount').textContent = CONFIG.discord.memberCount;
    }
    if (CONFIG.discord.inviteLink) {
        document.getElementById('joinBtn').href = CONFIG.discord.inviteLink;
    }

    // Социальные ссылки
    applySocialLinks();

    // Акцентный цвет
    if (CONFIG.design.accentColor) {
        document.documentElement.style.setProperty('--accent-color', CONFIG.design.accentColor);
    }
}

function applySocialLinks() {
    const container = document.getElementById('socialIcons');
    container.innerHTML = '';

    CONFIG.socialLinks.forEach(link => {
        const a = document.createElement('a');
        a.href = link.url;
        a.className = 'social-icon';
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.title = link.name;

        // Поддержка кастомных изображений иконок
        if (link.iconImage) {
            const img = document.createElement('img');
            img.src = link.iconImage;
            img.alt = link.name;
            img.style.width = '24px';
            img.style.height = '24px';
            img.style.objectFit = 'contain';
            img.style.filter = 'brightness(0) invert(1) drop-shadow(0 0 5px rgba(255,255,255,0.5))';
            a.appendChild(img);
        } else {
            // Font Awesome иконка
            const icon = document.createElement('i');
            icon.className = link.faIcon || 'fab fa-' + link.icon;
            icon.style.fontSize = '20px';
            icon.style.color = 'white';
            icon.style.filter = 'drop-shadow(0 0 5px rgba(255,255,255,0.5))';
            a.appendChild(icon);
        }

        container.appendChild(a);
    });
}

// ========================================
// Custom Cursor
// ========================================
function initializeCursor() {
    document.addEventListener('mousemove', (e) => {
        customCursor.style.left = e.clientX + 'px';
        customCursor.style.top = e.clientY + 'px';
    });

    document.addEventListener('mousedown', () => customCursor.classList.add('clicking'));
    document.addEventListener('mouseup', () => customCursor.classList.remove('clicking'));
}

// ========================================
// Visual Effects (Snow, Rain, CRT, Noise)
// ========================================
function initializeEffects() {
    // Снег
    if (CONFIG.effects.snowEnabled) {
        initializeSnow();
    }

    // Дождь
    if (CONFIG.effects.rainEnabled) {
        initializeRain();
    }

    // CRT
    if (CONFIG.effects.crtEnabled) {
        crtOverlay.classList.add('enabled');
        if (CONFIG.effects.crtFlicker) {
            crtOverlay.classList.add('flicker');
        }
    }

    // Шум
    if (CONFIG.effects.noiseEnabled) {
        noiseOverlay.classList.add('enabled');
    }
}

function initializeSnow() {
    const snowCount = CONFIG.effects.snowCount || 50;
    for (let i = 0; i < snowCount; i++) {
        setTimeout(() => createSnowflake(), i * 100);
    }
}

function createSnowflake() {
    const snowflake = document.createElement('div');
    snowflake.className = 'snowflake';
    snowflake.innerHTML = '❄';

    const size = Math.random() * 0.6 + 0.3;
    const left = Math.random() * 100;
    const duration = Math.random() * 8 + 10;
    const delay = Math.random() * 5;

    snowflake.style.cssText = `
        left: ${left}%;
        font-size: ${size}em;
        animation-duration: ${duration}s;
        animation-delay: ${delay}s;
        opacity: ${Math.random() * 0.4 + 0.2};
    `;

    snowContainer.appendChild(snowflake);
    snowflake.addEventListener('animationend', () => {
        snowflake.remove();
        createSnowflake();
    });
}

function initializeRain() {
    const rainCount = CONFIG.effects.rainCount || 100;
    for (let i = 0; i < rainCount; i++) {
        createRaindrop();
    }
}

function createRaindrop() {
    const raindrop = document.createElement('div');
    raindrop.className = 'raindrop';

    const left = Math.random() * 100;
    const duration = Math.random() * 0.5 + 0.3;
    const delay = Math.random() * 2;
    const height = Math.random() * 15 + 10;

    raindrop.style.cssText = `
        left: ${left}%;
        height: ${height}px;
        animation-duration: ${duration}s;
        animation-delay: ${delay}s;
    `;

    rainContainer.appendChild(raindrop);
    raindrop.addEventListener('animationend', () => {
        raindrop.remove();
        createRaindrop();
    });
}

// ========================================
// 3D Tilt Effect
// ========================================
function initializeTiltEffect() {
    const card = profileCard;
    const cardInner = card.querySelector('.card-inner');

    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = ((y - centerY) / centerY) * -10;
        const rotateY = ((x - centerX) / centerX) * 10;

        card.style.transform = `
            perspective(1000px) 
            rotateX(${rotateX}deg) 
            rotateY(${rotateY}deg)
            scale3d(1.02, 1.02, 1.02)
        `;

        const glowX = (x / rect.width) * 100;
        const glowY = (y / rect.height) * 100;
        cardInner.style.background = `
            radial-gradient(
                circle at ${glowX}% ${glowY}%,
                rgba(255, 255, 255, 0.06) 0%,
                rgba(20, 20, 30, 0.25) 50%
            )
        `;
    });

    card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
        cardInner.style.background = 'rgba(20, 20, 30, 0.25)';
    });

    card.style.transition = 'transform 0.15s ease-out';
}

// ========================================
// Gate
// ========================================
function initializeGate() {
    gate.addEventListener('click', enterSite);
}

function enterSite() {
    if (hasEntered) return;
    hasEntered = true;

    gate.classList.add('hidden');
    mainContainer.classList.add('visible');

    // Автозапуск музыки после клика (важно для браузерной политики)
    if (CONFIG.music.autoplay && playlist.length > 0) {
        setTimeout(() => {
            loadTrack(0);

            // Для видео-аудио нужно явно unmute
            if (useVideoAudio) {
                const bgVideo = document.getElementById('bgVideo');
                bgVideo.muted = false;
                bgVideo.volume = 1;
                bgVideo.play().then(() => {
                    isPlaying = true;
                    playBtn.innerHTML = '<i class="fas fa-pause"></i>';
                }).catch(err => {
                    console.log('Video audio autoplay failed:', err);
                    // Fallback - покажем кнопку play
                    isPlaying = false;
                    playBtn.innerHTML = '<i class="fas fa-play"></i>';
                });
            } else {
                playMusic();
            }
        }, 300);
    } else if (playlist.length > 0) {
        loadTrack(0);
    }
}

// ========================================
// Typewriter Effect
// ========================================
function initializeTypewriter() {
    const texts = CONFIG.profile.bio || ['Welcome!'];
    let textIndex = 0;
    let charIndex = 0;
    let isDeleting = false;

    function type() {
        const currentText = texts[textIndex];

        if (isDeleting) {
            typewriterEl.textContent = currentText.substring(0, charIndex - 1);
            charIndex--;
        } else {
            typewriterEl.textContent = currentText.substring(0, charIndex + 1);
            charIndex++;
        }

        let typeSpeed = isDeleting ? 30 : 80;

        if (!isDeleting && charIndex === currentText.length) {
            typeSpeed = 3000;
            isDeleting = true;
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            textIndex = (textIndex + 1) % texts.length;
            typeSpeed = 500;
        }

        setTimeout(type, typeSpeed);
    }

    type();
}

// ========================================
// Music Player
// ========================================
function initializeMusicPlayer() {
    if (playlist.length === 0) {
        document.getElementById('musicPlayer').style.display = 'none';
        return;
    }

    playBtn.addEventListener('click', togglePlay);
    prevBtn.addEventListener('click', previousTrack);
    nextBtn.addEventListener('click', nextTrack);

    if (useVideoAudio) {
        // Режим видео-аудио
        const bgVideo = document.getElementById('bgVideo');
        bgVideo.addEventListener('timeupdate', updateVideoProgress);
        bgVideo.addEventListener('loadedmetadata', updateVideoTotalTime);
        bgVideo.addEventListener('ended', () => {
            bgVideo.currentTime = 0;
            bgVideo.play();
        });
        musicTitle.textContent = 'Background Audio';

        // Скрываем кнопки prev/next в режиме видео
        prevBtn.style.display = 'none';
        nextBtn.style.display = 'none';
    } else {
        audioPlayer.addEventListener('timeupdate', updateProgress);
        audioPlayer.addEventListener('loadedmetadata', updateTotalTime);
        audioPlayer.addEventListener('ended', nextTrack);
        audioPlayer.addEventListener('error', handleTrackError);
    }

    progressBar.addEventListener('click', seekTo);
}

function handleTrackError() {
    console.log('Track failed to load, trying next...');
    // Если трек не загрузился, пробуем следующий
    const failedTrack = playlist[currentTrackIndex];
    playlist.splice(currentTrackIndex, 1);

    if (playlist.length === 0) {
        // Все треки не работают - переключаемся на видео
        if (CONFIG.design.backgroundVideo) {
            useVideoAudio = true;
            playlist = [{ title: 'Background Audio', url: 'video' }];
            initializeMusicPlayer();
            if (hasEntered) playMusic();
        } else {
            musicTitle.textContent = 'No music available';
        }
    } else {
        if (currentTrackIndex >= playlist.length) currentTrackIndex = 0;
        loadTrack(currentTrackIndex);
        if (isPlaying) playMusic();
    }
}

function loadTrack(index) {
    if (index < 0 || index >= playlist.length) return;
    currentTrackIndex = index;
    const track = playlist[index];

    if (useVideoAudio) {
        musicTitle.textContent = track.title;
        return;
    }

    audioPlayer.src = track.url;
    musicTitle.textContent = track.title;
    progressFill.style.width = '0%';
    currentTimeEl.textContent = '0:00';
}

function togglePlay() {
    isPlaying ? pauseMusic() : playMusic();
}

function playMusic() {
    if (useVideoAudio) {
        const bgVideo = document.getElementById('bgVideo');
        bgVideo.muted = false;
        bgVideo.volume = 1;
        bgVideo.play().then(() => {
            isPlaying = true;
            playBtn.innerHTML = '<i class="fas fa-pause"></i>';
        }).catch(err => console.log('Video playback error:', err));
    } else {
        audioPlayer.play().then(() => {
            isPlaying = true;
            playBtn.innerHTML = '<i class="fas fa-pause"></i>';
        }).catch(err => console.log('Playback error:', err));
    }
}

function pauseMusic() {
    if (useVideoAudio) {
        const bgVideo = document.getElementById('bgVideo');
        bgVideo.muted = true;
    } else {
        audioPlayer.pause();
    }
    isPlaying = false;
    playBtn.innerHTML = '<i class="fas fa-play"></i>';
}

function previousTrack() {
    if (useVideoAudio) return;
    let newIndex = currentTrackIndex - 1;
    if (newIndex < 0) newIndex = playlist.length - 1;
    loadTrack(newIndex);
    if (isPlaying) playMusic();
}

function nextTrack() {
    if (useVideoAudio) return;
    let newIndex = currentTrackIndex + 1;
    if (newIndex >= playlist.length) newIndex = 0;
    loadTrack(newIndex);
    if (isPlaying) playMusic();
}

function updateProgress() {
    const progress = (audioPlayer.currentTime / audioPlayer.duration) * 100;
    progressFill.style.width = progress + '%';
    currentTimeEl.textContent = formatTime(audioPlayer.currentTime);
}

function updateVideoProgress() {
    const bgVideo = document.getElementById('bgVideo');
    const progress = (bgVideo.currentTime / bgVideo.duration) * 100;
    progressFill.style.width = progress + '%';
    currentTimeEl.textContent = formatTime(bgVideo.currentTime);
}

function updateTotalTime() {
    totalTimeEl.textContent = formatTime(audioPlayer.duration);
}

function updateVideoTotalTime() {
    const bgVideo = document.getElementById('bgVideo');
    totalTimeEl.textContent = formatTime(bgVideo.duration);
}

function formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function seekTo(e) {
    const rect = progressBar.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;

    if (useVideoAudio) {
        const bgVideo = document.getElementById('bgVideo');
        bgVideo.currentTime = percent * bgVideo.duration;
    } else {
        audioPlayer.currentTime = percent * audioPlayer.duration;
    }
}

// View counter
if (!sessionStorage.getItem('visited')) {
    sessionStorage.setItem('visited', 'true');
    setTimeout(() => {
        const viewEl = document.getElementById('viewCount');
        let count = parseInt(viewEl.textContent.replace(/,/g, ''));
        viewEl.textContent = (count + 1).toLocaleString();
    }, 2000);
}
