import { registerRootComponent } from 'expo';
import App from './App';

// Web ortamındaki zararsız React Native Web stil uyarılarını filtrele
if (typeof console !== 'undefined' && console.warn) {
  const originalWarn = console.warn;
  console.warn = (...args) => {
    if (
      args[0] &&
      typeof args[0] === 'string' &&
      (args[0].includes('shadow*') || args[0].includes('pointerEvents'))
    ) {
      return;
    }
    originalWarn(...args);
  };
}

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
