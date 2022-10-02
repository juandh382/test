import AgoraRTC from "agora-rtc-sdk-ng"
import VirtualBackgroundExtension from "agora-extension-virtual-background";

const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

// Create a VirtualBackgroundExtension instance
const extension = new VirtualBackgroundExtension();
// Register the extension
AgoraRTC.registerExtensions([extension]);


let processor = null;

const localTracks = {
  audioTrack: null,
  videoTrack: null
}

const config = {
  appid: 'c1524ecb52da48a88e4bd610d33c2334',
  token: '007eJxTYKh/UpOmvfi3zbE64wMxIokSJ4z/PecvS1og2pXKxme48pkCQ7KhqZFJanKSqVFKoolFooVFqklSipmhQYqxcbKRsbHJt3uWyZf0rZPldc8zMEIhiM/MUJ6SxcAAABBkH7A=',
  channel: 'wdj'
}

// Dynamically create a container in the form of a DIV element to play the remote video track.
const remotePlayerContainer = document.createElement("div");
// Dynamically create a container in the form of a DIV element to play the local video track.
const localPlayerContainer = document.createElement('div');


const handleUserPublished = async (user, mediaType) => {

  // Subscribe to the remote user when the SDK triggers the "user-published" event.
  await agoraEngine.subscribe(user, mediaType);

  console.log("subscribe success");

  if (mediaType == "video") {

    remotePlayerContainer.id = user.uid.toString();
    remotePlayerContainer.textContent = "Remote user " + user.uid.toString();
    document.body.append(remotePlayerContainer);
    user.videoTrack.play(remotePlayerContainer);
  }

  if (mediaType == "audio") {
    user.audioTrack.play();
  }
}

const handleUserUnpublished = (user) => {
  console.log(user.uid + "has left the channel");
}

const join = async () => {
  client.on('user-published', handleUserPublished);
  client.on('user-unpublished', handleUserUnpublished);

  const uid = await client.join(config.appid, config.channel, config.token, null);

  setDivs(uid);

  localTracks.audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
  localTracks.videoTrack = await AgoraRTC.createCameraVideoTrack();

  // Append the local video container to the page body.
  document.body.append(localPlayerContainer);

  await client.publish(Object.values(localTracks));

  // Play the local video track.
  localTracks.videoTrack.play(localPlayerContainer);
  console.log("publish success!");
}

const setDivs = (uid) => {

  // Specify the ID of the DIV container. You can use the uid of the local user.
  localPlayerContainer.id = uid;
  // Set the textContent property of the local video container to the local user id.
  localPlayerContainer.textContent = "Local user " + uid;
  // Set the local video container size.
  localPlayerContainer.style.width = "640px";
  localPlayerContainer.style.height = "480px";
  localPlayerContainer.style.padding = "15px 5px 5px 5px";
  // Set the remote video container size.
  remotePlayerContainer.style.width = "640px";
  remotePlayerContainer.style.height = "480px";
  remotePlayerContainer.style.padding = "15px 5px 5px 5px";
}

const leave = async () => {

  localTracks.audioTrack.close();
  localTracks.videoTrack.close();

  removeVideoDiv(remotePlayerContainer.id);
  removeVideoDiv(localPlayerContainer.id);

  await client.leave();
  console.log("You left the channel");

  window.location.reload();
}


// Remove the video stream from the container.
const removeVideoDiv = (elementId) => {
  console.log("Removing " + elementId + "Div");
  let Div = document.getElementById(elementId);
  if (Div) {
    Div.remove();
  }
};


// Initialization
async function getProcessorInstance() {
  if (!processor && localTracks.videoTrack) {
    // Create a VirtualBackgroundProcessor instance
    processor = extension.createProcessor();

    try {
      // Initialize the extension and pass in the URL of the Wasm file
      await processor.init("./assets/wasms");
    } catch (e) {
      console.log("Fail to load WASM resource!"); return null;
    }
    // Inject the extension into the video processing pipeline in the SDK
    localTracks.videoTrack.pipe(processor).pipe(localTracks.videoTrack.processorDestination);
  }
  return processor;
}


// Set a solid color as the background
async function setBackgroundColor() {
  if (localTracks.videoTrack) {
    document.getElementById("loading").style.display = "block";

    let processor = await getProcessorInstance();

    try {
      processor.setOptions({ type: 'color', color: '#00ff00' });
      await processor.enable();
    } finally {
      document.getElementById("loading").style.display = "none";
    }

    virtualBackgroundEnabled = true;
  }
}


window.addEventListener('DOMContentLoaded', () => {

  document.getElementById("join").addEventListener('click', join);
  document.getElementById("leave").addEventListener('click', leave);
  document.getElementById("enableBackground").addEventListener('click', setBackgroundColor);

});