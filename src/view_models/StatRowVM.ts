export default class StatRowVM {
    constructor(
        public readonly voter: string, 
        public readonly allVotes: number, 
        public readonly forList: number, 
        public readonly notForList: number, 
        public readonly selfVotes: number) {
    }
}
