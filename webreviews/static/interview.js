// Глобальная переменная для блоба
var recordedVideo;
var time_codes = {}
var questions = {};

window.onload = function() {

    questions_json = document.getElementById('questions').textContent;

    console.log(questions_json)

    entries = Object.entries(JSON.parse(questions_json))

    entries.forEach(function (item, index) {
        questions[index.toString()] = item[1];
    });

    console.log(questions)

    let preview = document.getElementById("preview");
    let recording = document.getElementById("recording");
    let testButton = document.getElementById("testButton");
    let startButton = document.getElementById("startButton");
    let stopButton = document.getElementById("stopButton");
    let downloadButton = document.getElementById("downloadButton");
    let logElement = document.getElementById("log");

    let recordingTimeMS = 10000;

    function log(msg) {
        logElement.innerHTML += msg + "\n";
    }

    function wait(delayInMS) {
        return new Promise(resolve => setTimeout(resolve, delayInMS));
    }

    function startRecording(stream, lengthInMS) {
        let recorder = new MediaRecorder(stream);
        let data = [];

        recorder.ondataavailable = event => data.push(event.data);
        recorder.start();
        log(recorder.state + " for " + (lengthInMS / 1000) + " seconds...");

        let stopped = new Promise((resolve, reject) => {
            recorder.onstop = resolve;
            recorder.onerror = event => reject(event.name);
        });

        let recorded = wait(lengthInMS).then(
            () => recorder.state == "recording" && recorder.stop()
        );

        return Promise.all([
            stopped,
            recorded
        ])
            .then(() => data);
    }

    function stop(stream) {
        stream.getTracks().forEach(track => track.stop());
    }

    startButton.addEventListener("click", function () {
        navigator.mediaDevices.getUserMedia(constraints).then(stream => {
            preview.srcObject = stream;
            downloadButton.href = stream;
            preview.captureStream = preview.captureStream || preview.mozCaptureStream;
            return new Promise(resolve => preview.onplaying = resolve);
        }).then(() => startRecording(preview.captureStream(), recordingTimeMS))
            .then(recordedChunks => {
                let recordedBlob = new Blob(recordedChunks, {type: "video/webm"});
                recording.src = URL.createObjectURL(recordedBlob);
                downloadButton.href = recording.src;
                downloadButton.download = "RecordedVideo.webm";

                log("Successfully recorded " + recordedBlob.size + " bytes of " +
                    recordedBlob.type + " media.");
                recordedVideo = recordedBlob;
                // Этот код создаёт объёкт формы
                var formData = new FormData();
                // Этот добавляет записанный блоб (видео) в файлы формы
                formData.append('file', recordedVideo, "RecordedVideo.webm");
                // Этот создаёт запрос
                var request = new XMLHttpRequest();
                // Этот открывает запрос типа POST
                request.open("POST", "http://127.0.0.1:5000/upload");
                // Этот отсылает запрос
                request.send(formData);
            })
            .catch(log);
    }, false);

    stopButton.addEventListener("click", function () {
        stop(preview.srcObject);
    }, false);

    navigator.mediaDevices.enumerateDevices().then(gotDevicesVideo);

    const select = document.getElementById('select');
    const selectAudio = document.getElementById('selectAudio');

    //Выбор видео
    function gotDevicesVideo(mediaDevices) {
        select.innerHTML = '';
        select.appendChild(document.createElement('option'));
        let count = 1;
        mediaDevices.forEach(mediaDevice => {
            if (mediaDevice.kind === 'videoinput') {
                const option = document.createElement('option');
                option.value = mediaDevice.deviceId;
                const label = mediaDevice.label || `Camera ${count++}`;
                const textNode = document.createTextNode(label);
                option.appendChild(textNode);
                select.appendChild(option);
            }
        });

        //Выбор аудио
        selectAudio.innerHTML = '';
        selectAudio.appendChild(document.createElement('option'));
        let count2 = 1;
        mediaDevices.forEach(mediaDevices => {
            if (mediaDevices.kind === 'audioinput') {
                const option = document.createElement('option');
                option.value = mediaDevices.deviceId;
                const label = mediaDevices.label || `audioinput${count2++}`;
                const textNode = document.createTextNode(label);
                option.appendChild(textNode);
                selectAudio.appendChild(option);
            }
        });

        //Смена микрафона
        selectAudio.addEventListener("change", function () {
            listen((percent) => {
                updateBarIndicator(percent);
                updateTextIndicator(percent);
            });
        });
    }

    //Контейнер видео
    const videoConstraints = {};
    if (select.value === '') {
        videoConstraints.facingMode = 'environment';
    } else {
        videoConstraints.deviceId = {exact: select.value};
    }

    //Контейнер аудио
    const audioConstraints = {};
    if (selectAudio.value === '') {
        audioConstraints.facingMode = 'environment';
    } else {
        audioConstraints.deviceId = {exact: selectAudio.value};
    }

    //Контейнер настроек getuserMedia
    const constraints = {
        video: videoConstraints,
        audio: audioConstraints
    };

    //Кнопка теста
    testButton.addEventListener("click", function () {
        navigator.mediaDevices.getUserMedia(constraints).then(stream => {

            preview.srcObject = stream;
            console.log('navigator.getUserMedia error: ', error);

        });
    });

    //-----------Audio_Level------------

    async function listen(cb) {
        const stream = await navigator.mediaDevices.getUserMedia({audio: audioConstraints})
        const audioContext = new AudioContext();
        const analyser = audioContext.createAnalyser();
        const microphone = audioContext.createMediaStreamSource(stream);
        const javascriptNode = audioContext.createScriptProcessor(2048, 1, 1);

        analyser.smoothingTimeConstant = 0.8;
        analyser.fftSize = 1024;

        microphone.connect(analyser);
        analyser.connect(javascriptNode);
        javascriptNode.connect(audioContext.destination);
        javascriptNode.onaudioprocess = function () {
            const array = new Uint8Array(analyser.frequencyBinCount);
            analyser.getByteFrequencyData(array);
            let values = 0;

            const length = array.length;
            for (let i = 0; i < length; i++) {
                values += (array[i]);
            }

            const average = Math.round(values / length);
            cb(average);
        }
    }

    function updateBarIndicator(average) {
        const $el = document.querySelector('.indicator');
        $el.style.height = `${average}%`;
    }

    function updateTextIndicator(average) {
        const $el = document.querySelector('.percent');
        $el.textContent = `${average}%`;
    }

    //-----------Audio_Level_END------------



    //-----------Вопросы_START------------

    let nextButton = document.getElementById("nextButton");
    let testP = document.getElementById('testP');

    let indexQuestions=0;
    let timeIsOn=true;

    nextButton.addEventListener("click", function (){
        if (typeof questions[indexQuestions] != "undefined")
        {
           if (timeIsOn) {timer(); timeIsOn=false;}
           else {
               nowSec= Math.trunc(currentUser.timeGlobal);
               minute= Math.trunc(nowSec/60);
               if (minute>=1) sec=nowSec - minute*60;
               else sec=nowSec;
               time_codes[indexQuestions-1]=timeEdit(minute,sec);
               console.log(time_codes[indexQuestions-1]);

           }
            testP.innerHTML= questions[indexQuestions];
            indexQuestions++;
        }
        else
            {
                nowSec= Math.trunc(currentUser.timeGlobal);
                minute= Math.trunc(nowSec/60);
                if (minute>=1) sec=nowSec - minute*60;
                else sec=nowSec;
                time_codes[indexQuestions-1]=timeEdit(minute,sec);
                console.log(time_codes[indexQuestions-1]);

            testP.innerHTML='Конец опроса.';
                clearInterval(time);
                stop(preview.srcObject);
            console.log(time_codes);
            }


}, false);

    //Красивое время
function timeEdit(minute,sec) {
    if (sec<10) secstr='0'+sec;
    str=minute+':'+secstr;
    return str;
}


    function timer() {
        var buttons = $('[data-action="time"]');
        setTimer(0);

        function setTimer (index) {
            var button = buttons.get(index);
            target = $('[data-content="time"]', button)
            var start = Date.now()
            time = setInterval(function () {
                t=((Date.now() - start) / 1000).toFixed(1)
                target.text(t);
                currentUser.timeGlobal=t;
            }, 100);
        };
    }

    //-----------Вопросы_END--------------

}


window.currentUser = {
    timeGlobal:0
};




