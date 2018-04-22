import * as steem from 'steem'

export default class VoteVM {
    voter: string;
    authorperm: string;
    author: string;
    percent: number;
    time: Date;

    constructor(voter: string, data: steem.AccountVote) {
        this.voter = voter;
        this.authorperm = data.authorperm;
        this.author = this.authorperm.split("/", 1)[0];
        this.percent = data.percent / 10000;
        this.time = new Date(Date.parse(data.time + "Z"));
    }
}
