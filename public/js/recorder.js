document.addEventListener('DOMContentLoaded', () => {
    // Elementos del DOM
    const preview = document.getElementById('preview');
    const startBtn = document.getElementById('startBtn');
    const stopBtn = document.getElementById('stopBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const recordingIndicator = document.getElementById('recording-indicator');
    const errorMessage = document.getElementById('errorMessage');

    let mediaRecorder;
    let recordedChunks = [];

    // Función para mostrar errores
    const showError = (message) => {
        errorMessage.textContent = message;
        errorMessage.classList.remove('hidden');
        // Deshabilitar botones cuando hay un error
        startBtn.disabled = true;
        startBtn.classList.add('opacity-50', 'cursor-not-allowed');
    };

    // Inicializar la cámara
    async function initializeCamera() {
        try {
            // Verificar si el navegador soporta getUserMedia
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Tu navegador no soporta la grabación de video. Por favor, intenta con Chrome, Firefox o Edge.');
            }

            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: {
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                }, 
                audio: true 
            });
            preview.srcObject = stream;
            setupMediaRecorder(stream);
        } catch (err) {
            let errorMsg = 'Error al acceder a la cámara: ';
            
            // Mensajes de error más amigables
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                errorMsg += 'No se otorgó permiso para acceder a la cámara. Por favor, permite el acceso a la cámara y recarga la página.';
            } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
                errorMsg += 'No se encontró ninguna cámara. Por favor, conecta una cámara y recarga la página.';
            } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
                errorMsg += 'Tu cámara está siendo usada por otra aplicación. Por favor, cierra otras aplicaciones que puedan estar usando la cámara.';
            } else {
                errorMsg += err.message || 'Ocurrió un error desconocido al intentar acceder a la cámara.';
            }

            showError(errorMsg);
            console.error('Error accessing camera:', err);
        }
    }

    // Configurar el MediaRecorder
    function setupMediaRecorder(stream) {
        try {
            const mimeType = getSupportedMimeType();
            mediaRecorder = new MediaRecorder(stream, {
                mimeType: mimeType
            });

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    recordedChunks.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                downloadBtn.classList.remove('hidden');
            };

            // Habilitar el botón de inicio
            startBtn.disabled = false;
            startBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        } catch (err) {
            showError('Error al configurar la grabación: ' + err.message);
            console.error('Error setting up MediaRecorder:', err);
        }
    }

    // Obtener el tipo MIME soportado
    function getSupportedMimeType() {
        const types = [
            'video/webm;codecs=vp9,opus',
            'video/webm;codecs=vp8,opus',
            'video/webm',
            'video/mp4'
        ];

        for (const type of types) {
            if (MediaRecorder.isTypeSupported(type)) {
                return type;
            }
        }
        throw new Error('No se encontró un formato de video compatible');
    }

    // Event Listeners
    startBtn.addEventListener('click', () => {
        try {
            recordedChunks = [];
            mediaRecorder.start();
            startBtn.classList.add('hidden');
            stopBtn.classList.remove('hidden');
            recordingIndicator.classList.remove('hidden');
        } catch (err) {
            showError('Error al iniciar la grabación: ' + err.message);
            console.error('Error starting recording:', err);
        }
    });

    stopBtn.addEventListener('click', () => {
        try {
            mediaRecorder.stop();
            stopBtn.classList.add('hidden');
            startBtn.classList.remove('hidden');
            recordingIndicator.classList.add('hidden');
        } catch (err) {
            showError('Error al detener la grabación: ' + err.message);
            console.error('Error stopping recording:', err);
        }
    });

    downloadBtn.addEventListener('click', () => {
        try {
            const blob = new Blob(recordedChunks, {
                type: mediaRecorder.mimeType
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            a.href = url;
            a.download = `video-grabado-${timestamp}.webm`;
            a.click();
            URL.revokeObjectURL(url);
            downloadBtn.classList.add('hidden');
        } catch (err) {
            showError('Error al descargar el video: ' + err.message);
            console.error('Error downloading video:', err);
        }
    });

    // Iniciar la aplicación
    initializeCamera();
});