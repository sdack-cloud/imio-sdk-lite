import {IMIOContact} from "../entity/Contact";

export interface IMIOGroupListener {
    id : string;

    /**
     * 联系人变化通知
     * @param isDelete 是增加还是删除
     * @param contact 联系人
     */
    onContactChange(isDelete: boolean, contact: IMIOContact):void;

}
