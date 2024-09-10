const CustomEventTypes = {
  INIT_VOLUME_SETTINGS: 'INITIALIZE_VOLUME_SETTINGS',
  SET_VOLUME: 'SET_VOLUME',
  UPDATED_VOLUME_SETTINGS: 'UPDATED_VOLUME_SETTINGS',
};

// pass reference to game's volume settings object
let VolumeSettings = {};
async function bootAudioMixerServer() {
  console.log('$ WS audioServer boot');
  try {
    const volumeSettings = { ...VolumeSettings };
    const message = {
      type: CustomEventTypes.INIT_VOLUME_SETTINGS,
      data: volumeSettings,
    };
    const body = JSON.stringify(message);
    const socket = new WebSocket('ws://localhost:8080');
    // Event listener for when the connection is opened
    socket.addEventListener('open', (event) => {
      console.log('WebSocket connection opened');
      // Populate server with game's volume settings
      socket.send(body);
    });
    // Event listener for when a message is received from the server
    socket.addEventListener('message', (event) => {
      const parsedEvent = JSON.parse(event.data);
      if (parsedEvent.type === CustomEventTypes.SET_VOLUME) {
        console.log('[UPDATE EVENT] Update volume settings received by the audio server', parsedEvent.data);
        // Call AudioHandler.volumeControl passing in the trackName and update volume. This will immediately change the volume of the track in the game
        // Update game's volume settings object. This volume will be used when AudioHandler.play is called the next time.
      }
    });
    // Event listener for when the connection is closed
    socket.addEventListener('close', (event) => {
      console.log('WebSocket connection closed');
    });
    // Event listener for when an error occurs
    socket.addEventListener('error', (event) => {
      console.error('WebSocket error:', event);
    });
  } catch (error) {
    console.error('$ WS audioServer boot', error);
  }
}
