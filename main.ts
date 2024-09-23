/**
 * WebSocket server for managing game volume settings.
 * 
 * Listens for custom events to update and broadcast volume settings:
 * - INITIALIZE_VOLUME_SETTINGS: Initializes the volume settings.
 * - SET_VOLUME: Sets the volume for a specific track.
 * 
 * Example usage with wscat:
 * - Connect: wscat -c ws://localhost:8080
 * - Initialize settings: {"type":"INITIALIZE_VOLUME_SETTINGS","data":{"UIStop":0.5,"UIStart":0.5}}
 * - Set volume: {"type":"SET_VOLUME","data":{"audioKey":"boost_button","faderVolume":0.35}}
 */

import WebSocket from 'ws';

const CustomEventTypes = {
  INIT_VOLUME_SETTINGS: 'INITIALIZE_VOLUME_SETTINGS',
  SET_VOLUME: 'SET_VOLUME',
  SET_GLOBAL_VOLUME_STATE: 'SET_GLOBAL_VOLUME_STATE',
  UPDATED_VOLUME_SETTINGS: 'UPDATED_VOLUME_SETTINGS',
  SERVER_STATE: 'SERVER_STATE',
};
const WS_PORT = 8080;
const wsServer = new WebSocket.Server({ port: WS_PORT });

type VolumeSetting = {
  audioKey: string;
  faderVolume: number;
  group: string;
}

type EventData = Array<VolumeSetting>;

let bootedVolumeSettings: EventData = [
  {
    audioKey: "boost_button",
    faderVolume: 1,
    group: "UI",
  },
  {
    audioKey: "spin_button",
    faderVolume: 0.6,
    group: "UI",
  },
  {
    audioKey: "main_game_background",
    faderVolume: 1,
    group: "Music",
  },
];

wsServer.on('connection', (ws, req) => {
  ws.send(JSON.stringify({ type: CustomEventTypes.SERVER_STATE, data: { bootedVolumeSettings } }));
  ws.on('message', (message) => {
    let parsedMessage;
    try {
      parsedMessage = JSON.parse(message.toString());
    } catch (error) {
      console.log(`[ERROR] Received non-JSON message => ${message}`);
      return;
    }
    handleCustomEvent(parsedMessage.type, parsedMessage.data);
  });
});

console.log(`WebSocket server is running on port ${WS_PORT}`);

function handleCustomEvent(event: keyof typeof CustomEventTypes, data: any) {
  switch (event) {
    case CustomEventTypes.INIT_VOLUME_SETTINGS:
      console.log(`[EVENT] ${event}`);
      try {
        // console.log(`[INIT] volume settings: ${JSON.stringify(bootedVolumeSettings, null, '\t')}`);
        bootedVolumeSettings = data;
        console.log(`[INIT] volume settings: ${JSON.stringify(data, null, '\t')}`)
        const message = (JSON.stringify({ type: CustomEventTypes.SERVER_STATE, data: { bootedVolumeSettings } }));
        broadcastMessage(message);
      } catch (error) {
        console.log(`[ERROR] ${(error as Error).message}`);
      }
      break;
    case CustomEventTypes.SET_VOLUME:
      console.log(`[EVENT] ${event} => ${JSON.stringify(data, null, '\t')}`);
      try {
        if (!bootedVolumeSettings || Object.keys(bootedVolumeSettings).length === 0) {
          throw new Error('Server volume settings are not initialized. Please initialize settings)');
        }
        if (!data) return;
        const { audioKey, faderVolume } = data;
        updateVolume(bootedVolumeSettings, audioKey, faderVolume);
        console.log(`[UPDATED STATE] settings: bootedVolumeSettings`, bootedVolumeSettings);


        const message = (JSON.stringify({ type: CustomEventTypes.SERVER_STATE, data: { bootedVolumeSettings } }));
        broadcastMessage(message);
      } catch (error) {
        console.log(`[ERROR] ${(error as Error).message}`);
      }
      break;
    case CustomEventTypes.UPDATED_VOLUME_SETTINGS:
      console.log(`[EVENT] ${event}`);
      break;
    case CustomEventTypes.SET_GLOBAL_VOLUME_STATE:
      console.log(`[EVENT] ${event}`);
      try {
        if (!data) return;
        const { volumeSettings } = data;
        bootedVolumeSettings = volumeSettings
        console.log(`[UPDATED STATE] settings: bootedVolumeSettings`, bootedVolumeSettings);
        const message = (JSON.stringify({ type: CustomEventTypes.SERVER_STATE, data: { bootedVolumeSettings } }));
        broadcastMessage(message);
      } catch (error) {
        console.log(`[ERROR] ${(error as Error).message}`);
      }
      break;
    default:
      console.log(`[ERROR] Received unknown event type => ${event}`);
      console.log(`Try one of these: ${Object.values(CustomEventTypes)}`);
  }
}

function broadcastMessage(message: string) {
  wsServer.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

/**
 * Recursevely finds and updates the volume of a specific track in the settings object.
 */
function updateVolume(settings: Array<VolumeSetting>, audioKey: string, faderVolume: number) {
  let found = false;

  function recursiveUpdate(settings: Array<VolumeSetting>) {
    const newSettings = settings.map((item) => {
      if (item.audioKey === audioKey) {
        found = true;
        return {
          ...item,
          audioKey,
          faderVolume,
        }
      } else {
        return item;
      }
    });
    bootedVolumeSettings = newSettings;
  }
  recursiveUpdate(settings);
  if (!found) {
    throw new Error(`AudioKey "${audioKey}" not found`);
  }
}
