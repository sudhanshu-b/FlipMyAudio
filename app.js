let audioFile = null;
      let audioContext = null;
      let flippedAudioBuffer = null;

      // Handle audio upload
      function uploadAudio() {
        const fileInput = document.getElementById("fileInput");
        if (fileInput.files.length > 0) {
          audioFile = fileInput.files[0];



          document.getElementById("mainScreen").style.display = "none";
          document.getElementById("flipScreen").style.display = "flex";
        } else {
          alert("Please select an audio file.");
        }
      }

      //Handle audio flip
      function flipAudio() {
        if (audioFile) {
          audioContext = new (window.AudioContext ||
            window.webkitAudioContext)();
          const reader = new FileReader();

          reader.onload = function (event) {
            audioContext.decodeAudioData(
              event.target.result,
              function (buffer) {
            
                flippedAudioBuffer = reverseBuffer(buffer);

                // Display flipped audio and show the save button
                const audioElement = document.getElementById("flippedAudio");
                audioElement.src = "";
                audioElement.srcObject = null;
                audioElement.src = URL.createObjectURL(
                  bufferToBlob(flippedAudioBuffer)
                );
                audioElement.play();
                document.getElementById("saveBtn").style.display = "block";
              }
            );
          };

          reader.readAsArrayBuffer(audioFile);
        } else {
          alert("No audio file to flip.");
        }
      }

      //Reverse an audio buffer
      function reverseBuffer(buffer) {
        const reversedBuffer = audioContext.createBuffer(
          buffer.numberOfChannels,
          buffer.length,
          buffer.sampleRate
        );
        for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
          const sourceData = buffer.getChannelData(channel);
          const reversedData = reversedBuffer.getChannelData(channel);

          for (
            let i = 0, j = sourceData.length - 1;
            i < sourceData.length;
            i++, j--
          ) {
            reversedData[i] = sourceData[j];
          }
        }
        return reversedBuffer;
      }

      //Handle audio save
      function saveAudio() {
        if (flippedAudioBuffer) {
         
          downloadAudio(flippedAudioBuffer);
        } else {
          alert("No audio file to save.");
        }
      }


      function downloadAudio(buffer) {
        const a = document.createElement("a");
        const blob = bufferToBlob(buffer);
        const url = URL.createObjectURL(blob);
        a.href = url;
        a.download = "flipped_audio.mp3";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }

      // Function to convert an audio buffer to a Blob
      function bufferToBlob(buffer) {
        const interleaved = interleaveChannels(buffer);
        const dataView = encodeWAV(interleaved, buffer.sampleRate);
        return new Blob([dataView], { type: "audio/wav" });
      }

      // Function to interleave audio channels
      function interleaveChannels(buffer) {
        const channels = [];
        for (let i = 0; i < buffer.numberOfChannels; i++) {
          channels.push(buffer.getChannelData(i));
        }

        const interleaved = new Float32Array(
          buffer.length * buffer.numberOfChannels
        );
        let index = 0;
        for (let i = 0; i < buffer.length; i++) {
          for (let j = 0; j < buffer.numberOfChannels; j++) {
            interleaved[index++] = channels[j][i];
          }
        }

        return interleaved;
      }

      // Function to encode audio data as WAV
      function encodeWAV(interleaved, sampleRate) {
        const buffer = new ArrayBuffer(44 + interleaved.length * 2);
        const view = new DataView(buffer);

        // RIFF identifier
        writeString(view, 0, "RIFF");
        // RIFF chunk length
        view.setUint32(4, 36 + interleaved.length * 2, true);
        // RIFF type
        writeString(view, 8, "WAVE");
        // format chunk identifier
        writeString(view, 12, "fmt ");
        // format chunk length
        view.setUint32(16, 16, true);
        // sample format (1 means PCM)
        view.setUint16(20, 1, true);
        // number of channels
        view.setUint16(22, 2, true);
        // sample rate
        view.setUint32(24, sampleRate, true);
        // byte rate (sample rate * block align)
        view.setUint32(28, sampleRate * 4, true);
        // block align (channels * bytes per sample)
        view.setUint16(32, 4, true);
        // bits per sample
        view.setUint16(34, 16, true);
        // data chunk identifier
        writeString(view, 36, "data");
        // data chunk length
        view.setUint32(40, interleaved.length * 2, true);

        // write the PCM samples
        floatTo16BitPCM(view, 44, interleaved);

        return view;
      }

      // Helper function to write string to DataView
      function writeString(view, offset, string) {
        for (let i = 0; i < string.length; i++) {
          view.setUint8(offset + i, string.charCodeAt(i));
        }
      }

      // Helper function to convert float to 16-bit PCM
      function floatTo16BitPCM(view, offset, input) {
        for (let i = 0; i < input.length; i++, offset += 2) {
          const s = Math.max(-1, Math.min(1, input[i]));
          view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
        }
      }

      // Splash Screen
      setTimeout(function () {
        document.getElementById("splashScreen").style.display = "none";
        document.getElementById("mainScreen").style.display = "flex";
      }, 1000);
