import { defineStore, acceptHMRUpdate } from "pinia";

//setting store
import { useSettingsStore } from "./settings";
import { useTasksStore } from "./tasks";

export const useCounterStore = defineStore(
  "counter",

  {
    state: () => {
      const SettingStore = useSettingsStore();
      return {
        pauseTimer: false,
        needToChange: false,
        startAlarm: false,
        timerCountingIs: "promodro",
        //
        confirmChange: false,
        TimerIsCounting: false,
        //
        displayModel: false,
        confirmChange: false,
        //
        startPromodoro: true,
        promodoro: SettingStore.promodoro_npt,
        finishedPromodoros: 0,
        //
        startShortBreak: false,
        shortBreak: SettingStore.shortBreak_npt,
        //
        startLongBreak: false,
        longBreak: SettingStore.longBreak_npt,
        needLongBreak: false,
        focusMode: false,
      };
    },
    getters: {
      getPromodorocounter() {
        return this.timerStringFormat(this.promodoro);
      },
      gethortBreakcounter() {
        return this.timerStringFormat(this.shortBreak);
      },
      getLongBreakcounter() {
        return this.timerStringFormat(this.longBreak);
      },
      getTimerState() {
        if (this.pauseTimer) return "=>";
        return "||";
      },
    },
    actions: {
      startPromodorotTimer() {
        const Settingstore = useSettingsStore();
        const TasksStore = useTasksStore();
        if (Settingstore.focusedMode) this.focusMode = true;
        this.TimerIsCounting = this.startPromodoro = true;
        this.timerCountingIs = "promodoro";
        const interval = setInterval(() => {
          if (this.needToChange || this.pauseTimer) {
            clearInterval(interval);
            this.focusMode = false;
            return;
          }
          this.promodoro--;
          if (
            this.promodoro === Settingstore.notifyTime * 60 &&
            Settingstore.allowNotification
          )
            this.TimerNotifiesUser(Settingstore.notifyTime);
          if (this.promodoro == 2) this.startAlarm = true;
          if (this.promodoro <= 0 || !this.startPromodoro) {
            this.finishedPromodoros++;
            if (TasksStore.tasks.value.length) {
              TasksStore.tasks.value[TasksStore.selectedTaskNdx]
                .finishedPromdoros++;
            }
            !this.finishedPromodoros % Settingstore.rounds === 0
              ? this.getAshortBreak(Settingstore.autoStartBreaks)
              : this.getAlongBreak(Settingstore.autoStartBreaks);
            clearInterval(interval);
            this.focusMode = false;
            this.promodoro = Settingstore.promodoro_npt * 60;
          }
        }, 1000);
      },
      startShortBreakTimer() {
        const store = useSettingsStore();
        this.TimerIsCounting = true;
        this.timerCountingIs = "shortBreak";
        const interval = setInterval(() => {
          if (this.needToChange || this.pauseTimer) {
            clearInterval(interval);
            return;
          }

          this.shortBreak--;
          if (this.shortBreak == 2) this.startAlarm = true;
          if (this.shortBreak <= 0 || !this.startShortBreak) {
            clearInterval(interval);
            this.goToPromodoro(store.autoStartPromodoros);
            this.shortBreak = store.shortBreak_npt;
          }
        }, 1000);
      },
      startLongBreakTimer() {
        const store = useSettingsStore();
        this.TimerIsCounting = true;
        this.timerCountingIs = "longBreak";
        const interval = setInterval(() => {
          if (this.needToChange || this.pauseTimer) {
            clearInterval(interval);
            return;
          }
          this.longBreak--;
          if (this.longBreak == 2) this.startAlarm = true;
          if (this.longBreak <= 0 || !this.startLongBreak) {
            clearInterval(interval);
            this.goToPromodoro(store.autoStartPromodoros);
            this.longBreak = store.longBreak_npt;
          }
        }, 1000);
      },
      restartTimer() {
        const store = useSettingsStore();
        this.pauseTimer = true;
        this.promodoro = store.promodoro_npt * 60;
        this.longBreak = store.longBreak_npt * 60;
        this.shortBreak = store.shortBreak_npt * 60;
        this.TimerIsCounting = false;
        setTimeout(() => (this.pauseTimer = false), 1000);
      },
      pauseOrResumeTimer() {
        if (this.pauseTimer) {
          this.pauseTimer = false;
          this.needBreakConfirm(false);
          return;
        }
        this.pauseTimer = true;
      },
      goToPromodoro(autochange) {
        this.stopAll();
        this.startPromodoro = true;
        if (autochange) setTimeout(() => this.startPromodorotTimer(), 900);
      },
      getAshortBreak(autochange) {
        this.stopAll();
        this.startShortBreak = true;
        if (autochange) setTimeout(() => this.startShortBreakTimer(), 900);
      },
      getAlongBreak(autochange) {
        this.stopAll();
        this.startLongBreak = true;
        if (autochange) setTimeout(() => this.startLongBreakTimer(), 900);
      },
      changeToAnewPhase() {
        this.displayModel = true;
        this.needToChange = true;
      },
      changeAlarmSound(audioSrc) {
        audio_elem.src = audioSrc;
      },
      timerStringFormat(secondsFormat) {
        const min =
            parseInt(secondsFormat / 60) < 10
              ? `0${parseInt(secondsFormat / 60)}`
              : parseInt(secondsFormat / 60),
          second =
            parseInt(secondsFormat % 60) < 10
              ? `0${parseInt(secondsFormat % 60)}`
              : parseInt(secondsFormat % 60);
        return `${min} :${second}`;
      },
      TimerNotifiesUser(time) {
        if (!("Notification" in window)) {
          alert("This browser does not support desktop notification");
        } else if (Notification.permission === "granted") {
          console.log("notified");
          const notification = new Notification(
            `promodoro will be finished within ${time}`
          );
        } else if (Notification.permission !== "denied") {
          Notification.requestPermission().then((permission) => {
            if (permission === "granted") {
              const notification = new Notification(
                `promodoro will be finished within ${time}`
              );
              console.log("notified");
            }
          });
        }
      },
      needBreakConfirm(confirm) {
        switch (this.timerCountingIs) {
          case "promodoro":
            if (confirm) this.promodoro = 0;
            this.startPromodorotTimer();
            break;
          case "shortBreak":
            if (confirm) this.shortBreak = 0;
            this.startShortBreakTimer();
            break;
          case "longBreak":
            if (confirm) this.longBreak = 0;
            this.startLongBreakTimer();
            break;
        }
        this.needToChange = this.displayModel = false;
      },
      stopAll() {
        this.startPromodoro =
          this.startShortBreak =
          this.startLongBreak =
          this.TimerIsCounting =
            false;
      },
    },
  }
);

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useCounterStore, import.meta.hot));
}
