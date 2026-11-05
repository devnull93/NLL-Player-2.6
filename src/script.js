(function() {
    alert("The code had some annoying bug\nmeans the playback stops unexpectedly!");
    const mediaVideo = document.getElementById("mediaVideo");
    const spectrumCanvas = document.getElementById("spectrumCanvas");
    const ctx = spectrumCanvas.getContext("2d");
    const audioFileInput = document.getElementById("audioFileInput");
    const dropzone = document.getElementById("dropzone");
    const trackName = document.getElementById("trackName");

    const btnPlay = document.getElementById("btnPlay");
    const playIcon = document.getElementById("playIcon");
    const pauseIcon = document.getElementById("pauseIcon");

    const progressBar = document.getElementById("progressBar");
    const progressFill = document.getElementById("progressFill");
    const currentTimeEl = document.getElementById("currentTime");
    const durationTimeEl = document.getElementById("durationTime");

    let audioCtx;
    let analyser;
    let sourceNode;
    let isInitialized = false;

    function resizeCanvas() {
       spectrumCanvas.width = spectrumCanvas.parentElement.clientWidth;
       spectrumCanvas.height = spectrumCanvas.parentElement.clientHeight;
    }
    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();

    function initAudioPipeline() {
       if (isInitialized) return;
       audioCtx = new AudioContext();
       analyser = audioCtx.createAnalyser();
       analyser.fftSize = 128;

       sourceNode = audioCtx.createMediaElementSource(mediaVideo);
       sourceNode.connect(analyser);
       analyser.connect(audioCtx.destination);

       isInitialized = true;
    }

    async function safePlay() {
       if (audioCtx && audioCtx.state === "suspended") {
           await audioCtx.resume();
       }

       try {
           await mediaVideo.play();
           updatePlayPauseState(true);
       } catch {
           updatePlayPauseState(false);
       }
    }

    audioFileInput.addEventListener("change", (e) => {
       const file = e.target.files[0];
       if (!file) return;

       const fileUrl = URL.createObjectURL(file);
       mediaVideo.src = fileUrl;
       trackName.textContent = file.name;

       if (file.type.includes("video") || file.name.endsWith(".mp4")) {
           mediaVideo.style.display = "block";
       } else {
           mediaVideo.style.display = "none";
       }

       dropzone.style.display = "none";
       initAudioPipeline();
       safePlay();
    });

    btnPlay.addEventListener("click", () => {
       if (!mediaVideo.src) return;

       initAudioPipeline();

       if (mediaVideo.paused) {
           safePlay();
       } else {
           mediaVideo.pause();
           updatePlayPauseState(false);
       }
    });

    mediaVideo.addEventListener("ended", () => {
       updatePlayPauseState(false);
       progressFill.style.width = "100%";
    });

    function updatePlayPauseState(isPlaying) {
       if (isPlaying) {
           playIcon.style.display = "none";
           pauseIcon.style.display = "block";
       } else {
           playIcon.style.display = "block";
           pauseIcon.style.display = "none";
       }
    }

    function formatTime(secs) {
       if (isNaN(secs)) return "00:00";
       const m = Math.floor(secs / 60);
       const s = Math.floor(secs % 60);
       return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    }

    mediaVideo.addEventListener("timeupdate", () => {
       const current = mediaVideo.currentTime;
       const duration = mediaVideo.duration;
       if (duration && !mediaVideo.ended) {
           const pct = (current / duration) * 100;
           progressFill.style.width = `${pct}%`;
           currentTimeEl.textContent = formatTime(current);
           durationTimeEl.textContent = formatTime(duration);
       }
    });

    progressBar.addEventListener("click", (e) => {
       if (!mediaVideo.duration) return;
       const rect = progressBar.getBoundingClientRect();
       const pos = (e.clientX - rect.left) / rect.width;
       mediaVideo.currentTime = pos * mediaVideo.duration;
    });

    function drawSpectrumBars() {
       requestAnimationFrame(drawSpectrumBars);

       ctx.clearRect(0, 0, spectrumCanvas.width, spectrumCanvas.height);

       if (!analyser) return;

       const bufferLength = analyser.frequencyBinCount;
       const dataArray = new Uint8Array(bufferLength);
       analyser.getByteFrequencyData(dataArray);

       const barWidth = (spectrumCanvas.width / bufferLength) * 1.5;
       let x = 0;

       for (let i = 0; i < bufferLength; i++) {
            const barHeight = (dataArray[i] / 255) * spectrumCanvas.height * 0.85;

            const gradient = ctx.createLinearGradient(0, spectrumCanvas.height, 0, spectrumCanvas.height - barHeight);
            gradient.addColorStop(0, "rgba(0, 240, 255, 0.2)");
            gradient.addColorStop(0.6, "#00F0FF");
            gradient.addColorStop(1, "#FF007F");

            ctx.fillStyle = gradient;
            ctx.fillRect(x, spectrumCanvas.height - barHeight, barWidth - 3, barHeight);

            x += barWidth;
       }
    }

    drawSpectrumBars()
})();
