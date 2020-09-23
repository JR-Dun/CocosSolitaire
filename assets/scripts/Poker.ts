
const {ccclass, property} = cc._decorator;

@ccclass
export default class Poker extends cc.Component {

    @property(cc.Node)
    bgNode: cc.Node = null;

    @property(cc.Node)
    centerContainer: cc.Node = null;

    @property(cc.Node)
    rightContainer: cc.Node = null;

    @property(cc.Node)
    bottomContainer: cc.Node = null;

    @property(cc.Label)
    num: cc.Label = null;

    @property(cc.Sprite)
    bigType: cc.Sprite = null;

    @property(cc.Sprite)
    smallType: cc.Sprite = null;

    @property(cc.SpriteFrame)
    smallTypeSprites: Array<cc.SpriteFrame> = [];

    @property(cc.SpriteFrame)
    bigTypeSprites: Array<cc.SpriteFrame> = [];

    @property(cc.SpriteFrame)
    jqk: Array<cc.SpriteFrame> = [];

    jqkNames: Array<string> = ["J","Q","K"];

    public point: number = 0;
    public suit: number = 0;
    public pokerMoveContainer: cc.Node = null;
    public isFront: boolean = false;

    private positionTemp: cc.Vec2 = cc.Vec2.ZERO;
    private zIndexTemp: number = 0;
    private lastClickTime: number = 0;
    private currentClickTime: number = 0;

    private touchStartCallback: Function = null;
    private touchMoveCallback: Function = null;
    private touchEndCallback: Function = null;
    private singleClickCallback: Function = null;
    private doubleClickCallback: Function = null;

    

    start () {
        this.openTouch();
    }

    onEnable() {
        this.turnToBack();
    }

    onDestroy() {
        this.closeTouch();
    }

    private updateUI() {
        this.smallType.spriteFrame = this.smallTypeSprites[this.suit];
        this.bigType.spriteFrame = this.bigTypeSprites[this.suit];
        if(this.point > 10) {
            this.num.string = this.jqkNames[this.point - 10 - 1];
            this.bigType.spriteFrame = this.jqk[this.point - 10 - 1];
        }
        else {
            this.num.string = (this.point == 1) ? "A" : this.point.toString();
            this.bigType.spriteFrame = this.bigTypeSprites[this.suit];
        }
        this.num.node.color = (this.suit % 2 == 0) ? new cc.Color().fromHEX("#BE202E") : cc.Color.BLACK;
    }

    private openTouch (): void {
        this.node.on(cc.Node.EventType.TOUCH_START, this.touchStart.bind(this), this);
        this.node.on(cc.Node.EventType.TOUCH_MOVE, this.touchsMove.bind(this), this);
        this.node.on(cc.Node.EventType.TOUCH_END, this.touchEnd.bind(this), this);
        this.node.on(cc.Node.EventType.TOUCH_CANCEL, this.touchEnd.bind(this), this);
    }

    private closeTouch (): void {
        this.node.off(cc.Node.EventType.TOUCH_START, this.touchStart.bind(this), this);
        this.node.off(cc.Node.EventType.TOUCH_MOVE, this.touchsMove.bind(this), this);
        this.node.off(cc.Node.EventType.TOUCH_END, this.touchEnd.bind(this), this);
        this.node.off(cc.Node.EventType.TOUCH_CANCEL, this.touchEnd.bind(this), this);
    }

    private canTouch(): Boolean {
        let result = true;
        if(!this.isFront) result = false;
        if(this.rightContainer.childrenCount > 0) result = false;

        return result;
    }

    private touchStart (e: cc.Event.EventTouch): void {
        e.stopPropagation();

        this.lastClickTime = this.currentClickTime;
        this.currentClickTime = Date.now();
        
        if(!this.canTouch()) return;
        
        this.positionTemp = this.node.position;
        this.zIndexTemp = this.getZIndex();

        this.setZIndex(100);

        if(this.touchStartCallback) {
            this.touchStartCallback(this.node);
        }
    }

    private touchsMove (e: cc.Event.EventTouch): void {
        e.stopPropagation();
        
        if(!this.canTouch()) return;
        let delta = e.getDelta();
        this.node.position = delta.add(this.node.position);

        if(this.touchMoveCallback) {
            this.touchMoveCallback(this.node);
        }
    }

    private touchEnd (e: cc.Event.EventTouch): void {
        e.stopPropagation();
        
        if(!this.canTouch()) {
            if(this.singleClickCallback && 
               this.bottomContainer.childrenCount <= 0 && 
               (this.currentClickTime - this.lastClickTime) > 600 && 
               this.rightContainer.childrenCount <= 0) {
                this.singleClickCallback(this.node);
            }
            return;
        }

        if((this.currentClickTime - this.lastClickTime) <= 600) {
            if(this.doubleClickCallback && this.bottomContainer.childrenCount <= 0) {
                this.doubleClickCallback(this.node);
            }
        }

        this.setZIndex(this.zIndexTemp);

        if(this.touchEndCallback) {
            this.touchEndCallback(this.node);
        }
    }

    public turnToFront() {
        if(this.isFront) return;

        this.isFront = true;
        this.node.runAction(cc.sequence(
            cc.scaleTo(0.1, 0, 1),
            cc.callFunc(() => {
                this.bgNode.opacity = 0;
            }),
            cc.scaleTo(0.1, 1, 1)
        ));
    }

    public turnToBack() {
        this.isFront = false;
        this.bgNode.opacity = 255;
    }

    public reset() {
        this.node.runAction(cc.sequence(
            cc.moveTo(0.1, this.positionTemp),
            cc.callFunc(()=>{
                this.setZIndex(this.zIndexTemp);
            })
        ));
    }

    public setData(data: number, pokerMoveContainer: cc.Node) {
        this.pokerMoveContainer = pokerMoveContainer;
        this.suit = Math.floor((data - 1) / 13);
        this.point = (data - this.suit * 13) % 13;

        if(this.point == 0) this.point = 13;

        this.updateUI();
    }

    public setTouchCallback(touchStartCallback: Function, touchMoveCallback: Function, touchEndCallback: Function) {
        this.touchStartCallback = touchStartCallback;
        this.touchMoveCallback = touchMoveCallback;
        this.touchEndCallback = touchEndCallback;
    }

    public setClickCallback(singleClickCallback: Function, doubleClickCallback: Function) {
        this.singleClickCallback = singleClickCallback;
        this.doubleClickCallback = doubleClickCallback;
    }

    public setZIndex(zIndex: number) {
        let poker = this.node.parent.parent.getComponent(Poker);
        if(poker) {
            poker.setZIndex(zIndex);
        } else {
            this.node.zIndex = zIndex;
        }
    }

    public setBottomChild(child: cc.Node, ignoreRule: boolean = true): boolean {
        if(this.bottomContainer.childrenCount > 0) {
            return this.bottomContainer.children[0].getComponent(Poker).setBottomChild(child, ignoreRule);
        }
        else if(child == this.node) {
            this.reset();
            return false;
        }
        else {
            if(ignoreRule) {
                child.parent = this.bottomContainer;
                child.position = new cc.Vec2(0, 0);
                return true;
            } 
            else {
                let childPoker = child.getComponent(Poker);
                let absSuit = Math.abs(childPoker.suit - this.suit);
                if(childPoker.point == (this.point - 1) && (absSuit == 1 || absSuit == 3)) {
                    child.parent = this.bottomContainer;
                    child.position = new cc.Vec2(0, 0);
                    return true;
                }
                else {
                    childPoker.reset();
                    return false;
                }
            }
        }
    }

    public isBottomChild(child: cc.Node): boolean {
        if(this.bottomContainer.childrenCount > 0) {
            return this.bottomContainer.children[0].getComponent(Poker).isBottomChild(child);
        }
        else if(child == this.node) {
            return false;
        }
        else {
            let childPoker = child.getComponent(Poker);
            let absSuit = Math.abs(childPoker.suit - this.suit);
            if(childPoker.point == (this.point - 1) && (absSuit == 1 || absSuit == 3)) {
                return true;
            }
            else {
                return false;
            }
        }
    }

    public turnLastBottomChildToFront() {
        if(this.bottomContainer.childrenCount > 0) {
            this.bottomContainer.children[0].getComponent(Poker).turnLastBottomChildToFront();
        }
        else {
            this.turnToFront();
        }
    }

    public setRightChild(child: cc.Node) {
        if(this.rightContainer.childrenCount > 0) {
            this.rightContainer.children[0].getComponent(Poker).setRightChild(child);
        }
        else {
            child.parent = this.rightContainer;
            child.position = new cc.Vec2(0, 0);
            return true;
        }
    }

    public setCenterChild(child: cc.Node): boolean {
        if(this.centerContainer.childrenCount > 0) {
            return this.centerContainer.children[0].getComponent(Poker).setCenterChild(child);
        }
        else if(child == this.node) {
            this.reset();
            return false;
        }
        else {
            let childPoker = child.getComponent(Poker);
            if(childPoker.point == (this.point + 1) && childPoker.suit == this.suit) {
                child.parent = this.centerContainer;
                child.position = new cc.Vec2(0, 0);
                return true;
            }
            else {
                childPoker.reset();
                return false;
            }
        }
    }

    public isCenterChild(child: cc.Node): boolean {
        if(this.centerContainer.childrenCount > 0) {
            return this.centerContainer.children[0].getComponent(Poker).isCenterChild(child);
        }
        else if(child == this.node) {
            return false;
        }
        else {
            let childPoker = child.getComponent(Poker);
            if(childPoker.point == (this.point + 1) && childPoker.suit == this.suit) {
                return true;
            }
            else {
                return false;
            }
        }
    }

    public getZIndex() {
        let poker = this.node.parent.parent.getComponent(Poker);
        if(poker) {
            return poker.getZIndex();
        } else {
            return this.node.zIndex;
        }
    }

    public getBottomWorldPosition() {
        let world = cc.Vec2.ZERO;
        if(this.bottomContainer.childrenCount > 0) {
            world = this.bottomContainer.children[0].getComponent(Poker).getBottomWorldPosition();
        }
        else {            
            this.bottomContainer.parent.convertToWorldSpaceAR(this.bottomContainer.position, world);
        }
        return world;
    }

    public getCenterWorldPosition() {
        let world = cc.Vec2.ZERO; 
        if(this.centerContainer.childrenCount > 0) {
            world = this.centerContainer.children[0].getComponent(Poker).getCenterWorldPosition();
        }
        else {            
            this.centerContainer.parent.convertToWorldSpaceAR(this.centerContainer.position, world);
        }     
        return world;
    }

    public moveToWorldPosition(world: cc.Vec2, finishCallback: Function) {
        let nodePosition = cc.Vec2.ZERO;
        this.node.parent.convertToNodeSpaceAR(world, nodePosition);
        this.node.runAction(cc.sequence(
            cc.moveTo(0.1, nodePosition),
            cc.callFunc(() => {
                if(finishCallback) {
                    finishCallback();
                }
            })
        ));
    }

    public shakeAnimation() {
        let x = this.node.position.x;
        let y = this.node.position.y;
        this.node.runAction(cc.sequence(
            cc.moveTo(0.018, cc.v2(x + 5, y + 7)),
            cc.moveTo(0.018, cc.v2(x - 6, y + 7)),
            cc.moveTo(0.018, cc.v2(x - 13, y + 3)),
            cc.moveTo(0.018, cc.v2(x + 3, y - 6)),
            cc.moveTo(0.018, cc.v2(x - 5, y + 5)),
            cc.moveTo(0.018, cc.v2(x + 2, y - 8)),
            cc.moveTo(0.018, cc.v2(x - 8, y - 10)),
            cc.moveTo(0.018, cc.v2(x + 3, y + 10)),
            cc.moveTo(0.018, cc.v2(x + 0, y + 0)),
            cc.callFunc(()=>{
                this.node.position = new cc.Vec2(0, 0);
            })
        ));
    }

}
