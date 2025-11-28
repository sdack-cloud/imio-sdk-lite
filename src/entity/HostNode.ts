

export class IMIOHostNode {
    name:string = "";
    region:string = "";
    host:string = "";
    port:string = "";
    max:number = 0; // 最大承载人数
    type:boolean = true;
    current: number = 0; // 当前在线人数
}