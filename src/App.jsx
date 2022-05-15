
import { useState, useRef, useEffect } from "react"

export default function App() {
  const [isRecording, setIsRecording] = useState(false)
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const streamRecorderRef = useRef(null)
  const [downloadLink, setDownloadLink] = useState("")
  const [audioSource, setAudioSource] = useState("")
  const [videoSource, setVideoSource] = useState("")
  const [audioSourceOptions, setAudioSourceOptions] = useState([])
  const [videoSourceOptions, setVideoSourceOptions] = useState([])
  const [error, setError] = useState(null)
  const chunks = useRef([])

  function startRecording() {

    if (isRecording) {
      return
    }

    if (!streamRef.current) {
      return
    }

    streamRecorderRef.current = new MediaRecorder(streamRef.current)
    streamRecorderRef.current.start()
    streamRecorderRef.current.ondataavailable = function (event) {

      if (chunks.current) {
        chunks.current.push(event.data)
        setIsRecording(false)
      }
    }
    setIsRecording(true);
  }

  useEffect(
    function () {
      if (isRecording) {
        return
      }
      if (chunks.current.length === 0) {
        return
      }

      const blob = new Blob(chunks.current, {
        type: "video/x-matroska;codecs=avc1,opus"
      })
      
      setDownloadLink(URL.createObjectURL(blob))
      chunks.current = []
    },
    [isRecording]
  )

  function stopRecording() {
    if (!streamRecorderRef.current) {
      return
    }
    streamRecorderRef.current.stop()
    //setIsRecording(false)
  }

  useEffect(
    function () {
      async function prepareStream() {
        function gotStream(stream) {
          streamRef.current = stream
          if (videoRef.current) {
            videoRef.current.srcObject = stream
          }
        }

        async function getStream() {
          if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => {
              track.stop()
            })
          }
          const constraints = {
            audio: {
              deviceId: audioSource !== "" ? { exact: audioSource } : undefined
            },
            video: {
              deviceId: videoSource !== "" ? { exact: videoSource } : undefined
            }
          }
          try {
            const stream = await navigator.mediaDevices.getUserMedia(
              constraints
            )
            gotStream(stream)
          } catch (error) {
            setError(error)
          }
        }

        function getDevices() {
          return navigator.mediaDevices.enumerateDevices()
        }

        function gotDevices(deviceInfos) {
          const audioSourceOptions = []
          const videoSourceOptions = []
          for (const deviceInfo of deviceInfos) {
            if (deviceInfo.kind === "audioinput") {
              audioSourceOptions.push({
                value: deviceInfo.deviceId,
                label: deviceInfo.label || `Microphone ${deviceInfo.deviceId}`
              })
            } else if (deviceInfo.kind === "videoinput") {
              videoSourceOptions.push({
                value: deviceInfo.deviceId,
                label: deviceInfo.label || `Camera ${deviceInfo.deviceId}`
              })
            }
          }
          setAudioSourceOptions(audioSourceOptions)
          setVideoSourceOptions(videoSourceOptions)
        }

        await getStream()
        const mediaDevices = await getDevices()
        gotDevices(mediaDevices)
      }
      prepareStream()
    },
    [audioSource, videoSource]
  )

  return (
    <div>
      <div>
        <select id="videoSource" name="videoSource" defaultValue={videoSource}>
          {videoSourceOptions.map((option) => (
            <option key={option.value} defaultValue={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <select id="audioSource" name="audioSource" defaultValue={audioSource}>
          {audioSourceOptions.map((option) => (
            <option key={option.value} defaultValue={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <video ref={videoRef} autoPlay muted playsInline></video>
      </div>
      <div>
        {downloadLink && <video src={downloadLink} controls></video>}
        {downloadLink && (
          <a href={downloadLink} download="file.mp4">
            Descargar
          </a>
        )}
      </div>
      <div>
        <button onClick={startRecording} disabled={isRecording}>
          Grabar
        </button>
        <button onClick={stopRecording} disabled={!isRecording}>
          Parar
        </button>
      </div>
      <div>{error && <p>{error.message}</p>}</div>
    </div>
  )
}
