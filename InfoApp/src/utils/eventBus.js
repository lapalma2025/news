// src/utils/eventBus.js
import { EventEmitter } from "fbemitter";

const emitter = new EventEmitter();

export const eventBus = {
    emit: (event, data) => emitter.emit(event, data),
    on: (event, callback) => emitter.addListener(event, callback),
};

export const EVENTS = {
    NEWS_UPDATED: "news_updated",
    COMMENT_ADDED: "comment_added",
    LIKE_UPDATED: "like_updated",
};
