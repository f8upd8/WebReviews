// Глобальная переменная для блоба
var recordedVideo;
var questions = {};
var time_codes = {};

window.currentUser = {
    timeGlobal: 0
};

window.onload = function() {
    // Загрузка вопросов с html документа в словарь
    questions_json = document.getElementById('questions').textContent;
    entries = Object.entries(JSON.parse(questions_json))
    entries.forEach(function (item, index) {
        questions[index.toString()] = item[1];
    });
    // Конец загрузки вопросов
    let preview = document.getElementById("preview");
    let recording = document.getElementById("recording");
    let testButton = document.getElementById("testButton");
    let startButton = document.getElementById("startButton");
    let stopButton = document.getElementById("stopButton");
    let nextButton = document.getElementById("nextButton");
    let downloadButton = document.getElementById("downloadButton");
    let testP = document.getElementById('testP');

    let timeIsOn = true;
    let startRecordingB=false;
    let indexQuestions = 1;
    const select = document.getElementById('select');
    const selectAudio = document.getElementById('selectAudio');
    const videoConstraints = {};
    const audioConstraints = {};
    //Контейнер настроек getuserMedia
    const constraints = {
        video: videoConstraints,
        audio: audioConstraints
    };
    function controlTime (callback) {
        var stopTime;
    }

    openTab( 'welcome');

    //Контейнер видео
    if (select.value === '') {
        videoConstraints.facingMode = 'environment';
    } else {
        videoConstraints.deviceId = {
            exact: select.value
        };
    }

    //Контейнер аудио
    if (selectAudio.value === '') {
        audioConstraints.facingMode = 'environment';
    } else {
        audioConstraints.deviceId = {
            exact: selectAudio.value
        };
    }


     function waitt(delayInMS) {
         return new Promise(resolve => {setTimeout(resolve, delayInMS);} );
    }

    function startRecording(stream) {
        var recorder = new MediaRecorder(stream);
        let data = [];

        recorder.ondataavailable = event => data.push(event.data);
        recorder.start();


        let stopped = new Promise((resolve, reject) => {
            recorder.onstop = resolve;
            recorder.onerror = event => reject(event.name);
        });

      //  let promise = wait.until(function() {
       //     return stopTime != true;
       // })
      //  promise.then(function() {

        let recorded = wait.until(function(){
            let bool = controlTime!=false;
            return bool;
        })
        recorded.then(
            () =>
            recorder.state == "recording" && recorder.stop()
    );

    //});
        return Promise.all([
            stopped,
            recorded
        ])
            .then(() => data);
    }

    function stop(stream) {
        stream.getTracks().forEach(track => track.stop());
        stopTime = true;
    }

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
        selectAudio.addEventListener("change", function() {
            listen((percent) => {
                updateBarIndicator(percent);
                updateTextIndicator(percent);
            });
        });
    }

function starRecordin() {
    stopTime = false;
    navigator.mediaDevices.getUserMedia(constraints).then(stream => {
        preview.srcObject = stream;
        downloadButton.href = stream;
        preview.captureStream = preview.captureStream || preview.mozCaptureStream;
        return new Promise(resolve => preview.onplaying = resolve);
    }).then(() => startRecording(preview.captureStream()))
        .then(recordedChunks => {

            let recordedBlob = new Blob(recordedChunks, {type: "video/webm"});
            recording.src = URL.createObjectURL(recordedBlob);
            downloadButton.href = recording.src;
            downloadButton.download = "RecordedVideo.webm";

            console.log("Сохранение успешно!");
            console.log("Successfully recorded " + recordedBlob.size + " bytes of " +
                recordedBlob.type + " media.");

            recordedVideo = recordedBlob;
            // Этот код создаёт объёкт формы
            var formData = new FormData();
            // Этот добавляет записанный блоб (видео) в файлы формы
            formData.append('file', recordedVideo, "RecordedVideo.webm");
            formData.append('timeStamps', JSON.stringify(time_codes));
            // Этот создаёт запрос
            var request = new XMLHttpRequest();

            // Этот открывает запрос типа POST
            request.open("POST", window.location.href.split('#')[0] + '/submit');
            // Этот отсылает запрос
            request.send(formData);

            console.log("Была попытка отправки");
        })
}

    //Кнопка стоп
    stopButton.addEventListener("click", function() {
        stop(preview.srcObject);
        testP.innerHTML = 'Конец опроса.';
        clearInterval(time);
        controlTime=true;
        console.log("Успешная остановка");
    }, false);

    navigator.mediaDevices.enumerateDevices().then(gotDevicesVideo);

    //Кнопка теста
    testButton.addEventListener("click", function() {
        navigator.mediaDevices.getUserMedia(constraints).then(stream => {
            preview.srcObject = stream;
            console.log('navigator.getUserMedia error: ', error);
        });
    });



    // ----------Audio_Level------------
    async function listen(cb) {
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: audioConstraints
        })
        const audioContext = new AudioContext();
        const analyser = audioContext.createAnalyser();
        const microphone = audioContext.createMediaStreamSource(stream);
        const javascriptNode = audioContext.createScriptProcessor(2048, 1, 1);

        analyser.smoothingTimeConstant = 0.8;
        analyser.fftSize = 1024;

        microphone.connect(analyser);
        analyser.connect(javascriptNode);
        javascriptNode.connect(audioContext.destination);
        javascriptNode.onaudioprocess = function() {
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
    nextButton.addEventListener("click", function() {

        document.getElementById("nextButton").innerHTML="Следующий вопрос=>";
        var promise = wait.sleep(0);

        if (startRecordingB!=true) {
            controlTime=false;
            console.log("controltime=", controlTime);
            startRecordingB=true;
            starRecordin();
            var promise = wait.sleep(1000);
        }

        promise.then(function(){
            //do sth.
        if (typeof questions[indexQuestions] != "undefined") {
            if (timeIsOn) {
                timer();
                timeIsOn = false;
            } else {
                nowSec = Math.trunc(currentUser.timeGlobal);
                minute = Math.trunc(nowSec / 60);
                if (minute >= 1) sec = nowSec - minute * 60;
                else sec = nowSec;
                time_codes[indexQuestions - 1] = timeEdit(minute, sec);
                console.log(time_codes[indexQuestions - 1]);

            }
            testP.innerHTML = questions[indexQuestions];
            indexQuestions++;
        } else {
            nowSec = Math.trunc(currentUser.timeGlobal);
            minute = Math.trunc(nowSec / 60);
            if (minute >= 1) sec = nowSec - minute * 60;
            else sec = nowSec;
            time_codes[indexQuestions - 1] = timeEdit(minute, sec);
            console.log(time_codes[indexQuestions - 1]);

            testP.innerHTML = 'Конец опроса.';
            clearInterval(time);
            stop(preview.srcObject);
            controlTime=true;
            console.log(time_codes);
        }
        });
    }, false);

    //Красивое время
    function timeEdit(minute, sec) {

        if (sec < 10) secstr = '0' + sec;
        else secstr=sec;
        str = minute + ':' + secstr;
        return str;
    }


    function timer() {
        var buttons = $('[data-action="time"]');
        setTimer(0);

        function setTimer(index) {
            var button = buttons.get(index);
            target = $('[data-content="time"]', button)
            var start = Date.now()
            time = setInterval(function() {
                t = ((Date.now() - start) / 1000).toFixed(1)
                target.text(t);
                currentUser.timeGlobal = t;
            }, 100);
        };
    }

    //-----------Вопросы_END--------------



}
