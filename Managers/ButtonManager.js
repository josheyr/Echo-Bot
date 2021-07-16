module.exports = class CommandManager {
    constructor() {
        this.buttons = {};
    }

    addButton(button_id, callback) {
        this.buttons[button_id] = callback;
    }

    removeButton(button_id) {
        delete this.buttons[button_id];
    }

    callButton(button_id, clicker) {
        if (this.buttons[button_id])
            this.buttons[button_id](clicker);
    }
}