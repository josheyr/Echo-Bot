module.exports = class User {
    constructor(id) {
        this.id = id;
    }

    getId() {
        return this.id;
    }

    getApiKey() {
        return this.apiKey;
    }

    getUser() {
        return this.user;
    }
}