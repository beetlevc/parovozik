
export class Settings {
    static DefaultCurator: string = "stewardessa";
    static DefaultMembers: string[] = 
        "filinpaul,knopka145,trionyx-dv,chillipepper,fareast-history,uralvs,jhonni17,veta-less,veidemanphoto,arete0,sibr.hus,lubasmol,mister-omortson,fourapril,esperos,irvet,olgataul,orlova".split(",");
    static DefaultNumDays: number = 1;
    static MaxNumDays: number = 7;

    curator: string = Settings.DefaultCurator;
    members: string[] = Settings.DefaultMembers;
    numDays: number = Settings.DefaultNumDays;
}
