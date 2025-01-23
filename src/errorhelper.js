import axios from 'axios';

export class ErrorHelping {
  constructor(name, ownerid, secret, version) {
    this.name = name;
    this.ownerid = ownerid;
    this.secret = secret;
    this.version = version;
    this.sessionid = null;
    this.initialized = false;
  }

  async initialize() {
    try {
      const init_data = new FormData();
      init_data.append("type", "init");
      init_data.append("name", this.name);
      init_data.append("ownerid", this.ownerid);
      init_data.append("ver", this.version);

      const response = await axios({
        method: 'POST',
        url: 'https://keyauth.win/api/1.2/',
        data: init_data,
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (!response.data.success) {
        throw new Error(response.data.message);
      }

      this.sessionid = response.data.sessionid;
      this.initialized = true;
      return response.data;
    } catch (error) {
      throw new Error(`KeyAuth initialization failed: ${error.message}`);
    }
  }

  async license(key) {
    if (!this.initialized) {
      throw new Error('Please initialize first');
    }

    try {
      const license_data = new FormData();
      license_data.append("type", "license");
      license_data.append("key", key);
      license_data.append("name", this.name);
      license_data.append("ownerid", this.ownerid);
      license_data.append("sessionid", this.sessionid);

      const response = await axios({
        method: 'POST',
        url: 'https://keyauth.win/api/1.2/',
        data: license_data,
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (!response.data.success) {
        throw new Error(response.data.message);
      }

      return response.data;
    } catch (error) {
      throw new Error(`License verification failed: ${error.message}`);
    }
  }
}