import * as steem from 'steem'
import { LocalStorageKey, PostsPerPage } from '../constants'
import { getDiscussionsByCreatedAsync, getDynamicGlobalPropertiesAsync, getAccountsAsync, getAccountVotesAsync } from '../steemWrappers'
import { Settings } from '../models/Settings'
import { SettingsEditorVM } from './SettingsEditorVM'
import { Dictionary } from 'lodash';
import VoteVM from './VoteVM'
import StatRowVM from './StatRowVM'
import * as counterpart from 'counterpart'
import { CurrentLocale } from '../Translator'

function settings_parseInt(value: any, defaultValue: number, minValue: number, maxValue: number): number {
    const parsed = Number.parseInt(value);
    if (parsed) {
        if (parsed >= minValue && parsed <= maxValue)
            return parsed;
        else
            return defaultValue;
    } else {
        return defaultValue;
    }
}

function settings_parseStringArray(value: any, defaultValue: string[]): string[] {
    if (value && Array.isArray(value) && value.length)
        return value;
    else
        return defaultValue;
}

function stringColumnFilter(data?: string, filterString?: string): boolean {
    // console.log(data, filterString);
    if (filterString)
        return data !== undefined && data.toLowerCase().includes(filterString.trim().toLowerCase());
    else
        return true;
}

export function formatDateTime(value?: Date): string {
    return value ? value.toLocaleString(CurrentLocale) : "";
}

const MsInDay: number = 24 * 60 * 60 * 1000;

export default class AppVM {
    isSettingsPanelVisible: boolean = false;
    settings: Settings = new Settings();
    settingsEditor: SettingsEditorVM = new SettingsEditorVM();
    isLoading: number = 0;
    isError: boolean = false;
    loadVotesCount: number = 0;
    allCuratorVotes: VoteVM[] = [];
    allMemberVotes: VoteVM[] = [];
    memberVotes: VoteVM[] = [];
    stats: StatRowVM[] = [];
    loadingDetails: string = "";
    baseUrl = "https://steemit.com";

    statsColumns: any[] = [
        {
            label: counterpart("bvc.voter"),
            field: "voter",
            globalSearchDisabled: true,
            type: "text",
            filterOptions: {
                enabled: true, // enable filter for this column
                placeholder: " ", // placeholder for filter input
                filterValue: "", // initial populated value for this filter
                filterDropdownItems: [], // dropdown (with selected values) instead of text input
                filterFn: stringColumnFilter,
            },
        },
        {
            label: counterpart("bvc.for_list"),
            field: "forList",
            globalSearchDisabled: true,
            type: "percentage",
        },
        {
            label: counterpart("bvc.self_votes"),
            field: "selfVotes",
            globalSearchDisabled: true,
            type: "percentage",
        },
        {
            label: counterpart("bvc.not_for_list"),
            field: "notForList",
            globalSearchDisabled: true,
            type: "percentage",
        },
        {
            label: counterpart("bvc.all_votes"),
            field: "allVotes",
            globalSearchDisabled: true,
            type: "decimal",
        },
    ];

    votesColumns: any[] = [
        {
            label: counterpart("bvc.voter"),
            field: "voter",
            globalSearchDisabled: true,
            type: "text",
            filterOptions: {
                enabled: true, // enable filter for this column
                placeholder: " ", // placeholder for filter input
                filterValue: "", // initial populated value for this filter
                filterDropdownItems: [], // dropdown (with selected values) instead of text input
                filterFn: stringColumnFilter,
            },
        },
        {
            label: counterpart("bvc.post"),
            field: "authorperm",
            globalSearchDisabled: true,
            type: "text",
            filterOptions: {
                enabled: true, // enable filter for this column
                placeholder: " ", // placeholder for filter input
                filterValue: "", // initial populated value for this filter
                filterDropdownItems: [], // dropdown (with selected values) instead of text input
                filterFn: stringColumnFilter,
            },
        },
        {
            label: counterpart("bvc.percent"),
            field: "percent",
            globalSearchDisabled: true,
            type: "percentage",
        },
        {
            label: counterpart("bvc.time"),
            field: (x: VoteVM) => formatDateTime(x.time),
            globalSearchDisabled: true,
            type: "text",
            sortFn: (x: any, y: any, col: any, rowX: any, rowY: any) => 
            { 
                // x - row1 value for column
                // y - row2 value for column
                // col - column being sorted
                // rowX - row object for row1
                // rowY - row object for row2
                return rowX.time.valueOf() - rowY.time.valueOf();
            },
        },
    ];

    constructor() {
        this.loadSettings();
        this.reloadVotesAndCalcStats();
    }

    async reloadVotesAndCalcStats(): Promise<void> {
        if (this.loadVotesCount !== 0) return;
        this.isError = false;

        this.isLoading++;
        this.loadVotesCount++;
        try {
            this.memberVotes = [];
            this.stats = [];
            this.allCuratorVotes = [];
            this.allMemberVotes = [];
            const now = Date.now();
            const timeInterval = (Settings.MaxNumDays + 1) * MsInDay;
            this.loadingDetails = counterpart("bvc.loading_votes") + this.settings.curator;
            this.allCuratorVotes = (await getAccountVotesAsync(this.settings.curator))
                .map(x => new VoteVM(this.settings.curator, x))
                .filter(x => (now - x.time.valueOf()) < timeInterval);
            for (const account of this.settings.members) {
                this.loadingDetails = counterpart("bvc.loading_votes") + account;
                const memberVotes = (await getAccountVotesAsync(account))
                    .map(x => new VoteVM(account, x))
                    .filter(x => (now - x.time.valueOf()) < timeInterval);
                this.allMemberVotes.push(...memberVotes);
            }
        } catch (ex) {
            console.error(ex);
            this.isError = true;
        } finally {
            this.loadVotesCount--;
            this.isLoading--;
            this.loadingDetails = "";
        }
        this.calcStats();
    }

    calcStats() {
        if (this.loadVotesCount !== 0) return;

        this.memberVotes = [];
        this.stats = [];
        const now = Date.now();
        const timeInterval = this.settings.numDays * MsInDay;
        const curatorPermlinks: string[] = this.allCuratorVotes
            .filter(x => (now - x.time.valueOf()) < timeInterval)
            .filter(x => x.percent > 0)
            .map(x => x.authorperm);
        this.memberVotes = this.allMemberVotes
            .filter(x => (now - x.time.valueOf()) < timeInterval)
            .filter(x => x.percent > 0)
            .sort((a, b) => b.time.valueOf() - a.time.valueOf());
        this.stats = this.settings.members
            .map(accountName => {
                let userVotes = this.memberVotes
                    .filter(vote => vote.voter == accountName);
                let allvotes: number = 0;
                let votesforlist: number = 0;
                let selfvotes: number = 0;
                for (let i = 0, len = userVotes.length; i < len; i++) {
                    const vote = userVotes[i];
                    allvotes += vote.percent;
                    const isForList = curatorPermlinks.indexOf(vote.authorperm) > -1;
                    if (isForList) {
                        if (vote.author == accountName)
                            selfvotes += vote.percent;
                        else
                            votesforlist += vote.percent;
                    }
                }
                return new StatRowVM(
                    accountName,
                    allvotes,
                    allvotes != 0 ? votesforlist / allvotes : 0,
                    allvotes != 0 ? (allvotes - selfvotes - votesforlist) / allvotes : 0,
                    allvotes != 0 ? selfvotes / allvotes : 0);
            })
    }

    showSettingsPanel(): void {
        this.isSettingsPanelVisible = true;

        this.settingsEditor.curator = this.settings.curator;
        this.settingsEditor.members = this.settings.members.join(", ");
        this.settingsEditor.numDays = this.settings.numDays.toString();
    }

    hideSettingsPanel(): void {
        this.isSettingsPanelVisible = false;
    }

    applySettings(): void {
        const curator = this.settingsEditor.curator;
        const isCuratorChanged = this.settings.curator !== curator;
        const isMembersChanged = this.settings.members.join(", ") !== this.settingsEditor.members;
        this.settings.curator = curator;
        this.settings.members = this.settingsEditor.members ? this.settingsEditor.members.split(",").map(x => x.trim()) : []
        this.settings.numDays = settings_parseInt(this.settingsEditor.numDays, Settings.DefaultNumDays, 1, Settings.MaxNumDays);

        this.saveSettings();
        if (isCuratorChanged || isMembersChanged)
            this.reloadVotesAndCalcStats(); // только запускаем, но не ждем завершения
        else
            this.calcStats();
    }

    loadSettings(): void {
        this.settings = new Settings();
        try {
            const settingsString = localStorage.getItem(LocalStorageKey);
            const settings: Settings = settingsString ? JSON.parse(settingsString) : new Settings();

            this.settings.curator = settings.curator;
            this.settings.members = settings_parseStringArray(settings.members, Settings.DefaultMembers);
            this.settings.numDays = settings_parseInt(settings.numDays, Settings.DefaultNumDays, 1, Settings.MaxNumDays);
        } catch (ex) {
            console.log("Could not load settings.");
            console.error(ex);
        }
    }

    saveSettings(): void {
        const settingsString = JSON.stringify(this.settings);
        try {
            localStorage.setItem(LocalStorageKey, settingsString);
        } catch {
            console.error("Could not save settings.");
        }
    }
}
