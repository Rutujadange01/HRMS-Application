// Polyfills for Firebase JS SDK compatibility in React Native / Expo
if (typeof window === 'undefined') {
  global.window = global;
}

if (!global.window.localStorage) {
  global.window.localStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {},
  };
}

if (!global.window.sessionStorage) {
  global.window.sessionStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {},
  };
}

if (!global.window.location) {
  global.window.location = {
    href: '',
    protocol: 'https:',
    host: '',
    hostname: '',
    pathname: '',
    search: '',
    hash: '',
  };
}
