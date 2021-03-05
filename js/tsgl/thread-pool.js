"use strict";
const MAX_RUNNING_THREADS_IN_POOL = 32;
const POOL_STATUS_REFRESH_INTERVAL_PERCENT = 5;
class ThreadPool {
    constructor(domStatusElement, maxRunningThreadCount = MAX_RUNNING_THREADS_IN_POOL, statusRefreshIntervalPercent = POOL_STATUS_REFRESH_INTERVAL_PERCENT) {
        this.threads = [];
        this.results = [];
        this.statusRefreshInterval = 1;
        this.lastStatusRefresh = 0;
        this.finishedThreadsCount = 0;
        this.statusProgressPercent = 0;
        this.domStatusElement = domStatusElement;
        this.maxRunningThreadCount = maxRunningThreadCount;
        this.statusRefreshIntervalPercent = statusRefreshIntervalPercent;
    }
    add(...methods) {
        for (let i = 0, length = methods.length; i < length; i++) {
            this.addThread(new Thread(methods[i]));
        }
        this.statusRefreshInterval =
            (this.threads.length / 100) * this.statusRefreshIntervalPercent;
    }
    addThread(thread) {
        thread.setCallback(this.threadCallback.bind(this));
        this.threads.push(thread);
    }
    async run() {
        this.startTime = performance.now();
        const threadPool = this;
        return new Promise(async (resolve) => {
            threadPool.startNextThreads(threadPool.maxRunningThreadCount);
            // TODO: Make better.
            while (!threadPool.isFinished()) {
                await new Promise((r) => setTimeout(r, 500));
            }
            this.domStatusElement.setFinish();
            resolve(threadPool.results);
        });
    }
    threadCallback() {
        this.finishedThreadsCount++;
        if (this.finishedThreadsCount - this.lastStatusRefresh >=
            this.statusRefreshInterval) {
            this.updateStatus();
            this.lastStatusRefresh = this.finishedThreadsCount;
        }
        if (this.isFinished()) {
            for (let i = 0, length = this.threads.length; i < length; i++) {
                this.results.push(this.threads[i].getResult());
            }
            const durationInSeconds = Math.round(performance.now() - this.startTime);
            // TODO: Display duration.
            this.updateStatus();
        }
        else {
            this.startNextThreads();
        }
    }
    startNextThreads(count = 1) {
        if (count > 0) {
            let startedThreadsCount = 0;
            for (let i = 0, length = this.threads.length; i < length; i++) {
                if (!this.threads[i].isStarted()) {
                    this.threads[i].run();
                    startedThreadsCount++;
                    if (startedThreadsCount >= count) {
                        break;
                    }
                }
            }
        }
    }
    isFinished() {
        for (let i = 0, length = this.threads.length; i < length; i++) {
            if (!this.threads[i].isFinished()) {
                return false;
            }
        }
        return true;
    }
    updateStatus() {
        this.statusProgressPercent =
            (this.finishedThreadsCount / this.threads.length) * 100;
        this.domStatusElement.updateProgress(this.statusProgressPercent);
    }
}
class Thread {
    constructor(method) {
        this.finished = false;
        this.started = false;
        this.method = method;
    }
    setCallback(callback) {
        this.callback = callback;
    }
    isFinished() {
        return this.finished;
    }
    setStarted() {
        this.started = true;
    }
    isStarted() {
        return this.started;
    }
    getResult() {
        return this.result;
    }
    setFinished(result) {
        this.result = result;
        this.finished = true;
        this.callback();
    }
    run() {
        this.setStarted();
        const thisMethod = this.method;
        const thenCall = this.setFinished.bind(this);
        setTimeout(() => {
            const promise = new Promise((resolve) => {
                const result = thisMethod();
                resolve(result);
            });
            promise.then((result) => {
                thenCall(result);
            }, (reason) => {
                console.error(reason);
            });
        });
    }
}
