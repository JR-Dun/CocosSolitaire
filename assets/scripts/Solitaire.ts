import Poker from "./Poker";
import { PoolManager } from "./CommonLib_git/Pool/PoolManager";

const {ccclass, property} = cc._decorator;

@ccclass
export default class Solitaire extends cc.Component {

    @property(cc.Node)
    foundationStacks: cc.Node = null;

    @property(cc.Node)
    tableauStacks: cc.Node = null;

    @property(cc.Node)
    pokersContainer: cc.Node = null;

    @property(cc.Prefab)
    pokerPrefab: cc.Prefab = null;

    private pokerStacks: Array<cc.Node> = [];
    private recyclePokerStacks: Array<cc.Node> = [];
    private tableauPokerStacks: Array<cc.Node> = [];
    private winPokerStacks: Array<cc.Node> = [null, null, null, null];

    

    start () {
        console.log("!! ", this.getRandomArray())

        this.generatePoker();
    }

    getRandomArray(): Array<number> {
        let result: Array<number> = [];
        for(let i = 0; i < 52; i++) {
            result[i] = i + 1;
        }

        result.sort(function() { return 0.5 - Math.random(); });

        return result;
    }

    getStartStackPosition(): cc.Vec2 {
        let world = cc.Vec2.ZERO;
        this.foundationStacks.convertToWorldSpaceAR(this.foundationStacks.children[5].position, world);
        // this.node.parent.convertToNodeSpaceAR(world, targetPosition);
        return world;
    }

    getThreeCardsStackPosition(): cc.Vec2 {
        let world = cc.Vec2.ZERO;
        this.foundationStacks.convertToWorldSpaceAR(this.foundationStacks.children[4].position, world);
        return world;
    }

    getWinStackPosition(index: number): cc.Vec2 {
        let world = cc.Vec2.ZERO;
        this.foundationStacks.convertToWorldSpaceAR(this.foundationStacks.children[index].position, world);
        return world;
    }
    
    getWinStackIndex(worldX: number): number {
        let result = 0;
        let distance = 0;
        let minDistance = 0;
        let stackWorldX = 0;
        for(let i = 0; i < 4; i++) {
            stackWorldX = this.getWinStackPosition(i).x;
            distance = Math.abs(stackWorldX - worldX);
            if(i == 0 || minDistance > distance) {
                minDistance = distance;
                result = i;
            }
        }
        return result;
    }

    getTableauStackPosition(index: number): cc.Vec2 {
        let world = cc.Vec2.ZERO;
        this.tableauStacks.convertToWorldSpaceAR(this.tableauStacks.children[index].position, world);
        return world;
    }
    
    getTableauStackIndex(worldX: number): number {
        let result = 0;
        let distance = 0;
        let minDistance = 0;
        let stackWorldX = 0;
        for(let i = 0; i < 7; i++) {
            stackWorldX = this.getTableauStackPosition(i).x;
            distance = Math.abs(stackWorldX - worldX);
            if(i == 0 || minDistance > distance) {
                minDistance = distance;
                result = i;
            }
        }
        return result;
    }

    converToPokersNodePosition(world: cc.Vec2): cc.Vec2 {
        let nodePosition = cc.Vec2.ZERO;
        this.pokersContainer.convertToNodeSpaceAR(world, nodePosition);
        return nodePosition;
    }

    // 生成52张牌
    generatePoker() {
        PoolManager.GetGroup("Poker", null, 52, (result:boolean, nodeArray:Array<cc.Node>)=>{
            if(result) {
                let dataArray = this.getRandomArray();
                let startPosition = this.converToPokersNodePosition(this.getStartStackPosition());
                nodeArray.forEach((pokerNode, index) => {
                    pokerNode.parent = this.pokersContainer;
                    pokerNode.position = new cc.Vec2(startPosition.x, startPosition.y + index * 0.5);
                    let poker = pokerNode.getComponent(Poker);
                    pokerNode.zIndex = index;
                    poker.setData(dataArray[index], this.pokersContainer);
                    poker.setTouchCallback(this.pokerTouchStart.bind(this), this.pokerTouchMove.bind(this), this.pokerTouchEnd.bind(this));
                    poker.setClickCallback(this.pokerSingleClick.bind(this), this.pokerDoubleClick.bind(this));
                });
                this.pokerStacks = nodeArray;
                this.dealCardsAnimation();
            }
        });
    }

    // 发牌动画
    dealCardsAnimation() {
        let count = 0;
        for(let i = 0; i < 7; i++) {
            for(let j = i; j < 7; j++) {
                count++;
                let toPosition = this.converToPokersNodePosition(this.getTableauStackPosition(j));
                let pokerNode = this.pokerStacks.pop();
                pokerNode.runAction(cc.sequence(
                    cc.delayTime(0.1 * count),
                    cc.spawn(
                        cc.moveTo(0.25, new cc.Vec2(toPosition.x, toPosition.y + (i * -30))),
                        cc.sequence(
                            cc.delayTime(0.15),
                            cc.callFunc(() => {
                                pokerNode.zIndex = i + j;
                            })
                        )
                    ),
                    cc.callFunc(() => {
                        pokerNode.zIndex = 1;
                        if(i == 0) {
                            this.tableauPokerStacks.push(pokerNode);
                        }
                        else {
                            let parent = this.tableauPokerStacks[j].getComponent(Poker);
                            parent.setBottomChild(pokerNode);
                        }

                        if(i == j) {
                            pokerNode.getComponent(Poker).turnToFront();
                        }
                    })
                ));
            }
        }
    }

    // 翻三张牌
    getThreeCardsAnimation() {
        this.recyclePokerStacks.forEach(poker => {
            poker.removeFromParent(false);
        });

        let firstNode: cc.Node = null;
        for(let i = 0; i < 3; i++) {
            let toPosition = this.converToPokersNodePosition(this.getThreeCardsStackPosition());
            let pokerNode = this.pokerStacks.pop();
            if(!pokerNode) break;
            pokerNode.runAction(cc.sequence(
                cc.delayTime(0.1 * i),
                cc.spawn(
                    cc.moveTo(0.15, new cc.Vec2(toPosition.x - 22 + i * 27, toPosition.y)),
                    cc.sequence(
                        cc.delayTime(0.1),
                        cc.callFunc(() => {
                            pokerNode.zIndex = 52 + i;
                        })
                    )
                ),
                cc.callFunc(() => {
                    if(i == 0) {
                        firstNode = pokerNode;
                    }
                    else {
                        firstNode.getComponent(Poker).setRightChild(pokerNode);
                    }
                    pokerNode.getComponent(Poker).turnToFront();
                })
            ))
            this.recyclePokerStacks.push(pokerNode);
        }
    }

    // 整理牌堆
    resetCards() {
        let startPosition = this.converToPokersNodePosition(this.getStartStackPosition());
        let count = 0;
        while(this.recyclePokerStacks.length > 0) {
            let pokerNode = this.recyclePokerStacks.pop();
            pokerNode.parent = this.pokersContainer;
            count++;
            pokerNode.zIndex = 1;
            pokerNode.position = new cc.Vec2(startPosition.x, startPosition.y + count * 0.5);
            this.pokerStacks.push(pokerNode);
            let poker = pokerNode.getComponent(Poker);
            poker.turnToBack();
        }

    }

    // 放置牌到win区
    setPokerWinInStack(node: cc.Node, toWinIndex: number) {
        let poker = node.getComponent(Poker);
        if(!this.winPokerStacks[toWinIndex]) { 
            if(poker.point == 1) {
                this.winPokerStacks.forEach((stackNode, index) => {
                    if(stackNode == node) {
                        this.winPokerStacks[index] = null;
                    }
                });

                this.tableauPokerStacks.forEach((stackNode, index) => {
                    if(stackNode == node) {
                        this.tableauPokerStacks[index] = null;
                    }
                });

                node.parent = this.pokersContainer;
                this.winPokerStacks[toWinIndex] = node;

                let toPosition = this.converToPokersNodePosition(this.getWinStackPosition(toWinIndex));
                node.position = new cc.Vec2(toPosition.x, toPosition.y);

                this.removeFromRecyclePokeStack(node);
            }
            else {
                node.getComponent(Poker).reset();
            }
        }
        else if(this.winPokerStacks[toWinIndex] == node) {
            node.getComponent(Poker).reset();
        }
        else {
            let stackPoker = this.winPokerStacks[toWinIndex].getComponent(Poker);
            if(stackPoker) {
                if(stackPoker.setCenterChild(node)) {
                    this.removeFromRecyclePokeStack(node);

                    this.tableauPokerStacks.forEach((stackNode, index) => {
                        if(stackNode == node) {
                            this.tableauPokerStacks[index] = null;
                        }
                    });
                }
            }
        }
    }

    // 设置为牌堆第一个牌
    setPokerTheFirstInStack(node: cc.Node, toStackIndex: number) {
        let poker = node.getComponent(Poker);

        if(poker.point == 13) {
            node.parent = this.pokersContainer;
            this.tableauPokerStacks[toStackIndex] = node;

            let toPosition = this.converToPokersNodePosition(this.getTableauStackPosition(toStackIndex));
            node.position = new cc.Vec2(toPosition.x, toPosition.y);
            node.zIndex = poker.point;
            this.tableauPokerStacks.forEach((stackNode, index) => {
                if(stackNode == node && index != toStackIndex) {
                    this.tableauPokerStacks[index] = null;
                }
            });

            this.removeFromRecyclePokeStack(node);
        }
        else {
            node.getComponent(Poker).reset();
        }
    }

    // 移动到另一个牌堆
    movePokerToAnotherStack(node: cc.Node, toStackIndex: number) {
        let stackPoker = this.tableauPokerStacks[toStackIndex].getComponent(Poker);
        if(stackPoker) {
            if(stackPoker.setBottomChild(node, false)) {        
                this.recyclePokerStacks = this.recyclePokerStacks.filter(item => item !== node);
            }
        }

        this.tableauPokerStacks.forEach((stackNode, index) => {
            if(stackNode == node) {
                this.tableauPokerStacks[index] = null;
            }
        });

        this.winPokerStacks.forEach((stackNode, index) => {
            if(stackNode == node) {
                this.winPokerStacks[index] = null;
            }
        });

        this.setTheLastPokerInStacksOpen();
    }

    // 保证每一列排队至少显示一张牌
    setTheLastPokerInStacksOpen() {
        this.tableauPokerStacks.forEach(stackNode => {
            if(stackNode) {
                let poker = stackNode.getComponent(Poker);
                if(poker) {
                    poker.turnLastBottomChildToFront();
                }
            }
        });
    }

    // 移出回收区并且保证每一列排队至少显示一张牌
    removeFromRecyclePokeStack(node: cc.Node) {
        this.recyclePokerStacks = this.recyclePokerStacks.filter(item => item !== node);
        this.setTheLastPokerInStacksOpen();
    }

    // poker 回调
    pokerTouchStart(node: cc.Node) { }
    pokerTouchMove(node: cc.Node) { }
    pokerTouchEnd(node: cc.Node) { 
        let world = cc.Vec2.ZERO;
        node.parent.convertToWorldSpaceAR(node.position, world);
        let stackIndex = this.getTableauStackIndex(world.x);

        if(world.y - 100 > this.getTableauStackPosition(0).y) {
            //win区
            if(world.x - 50 > this.getWinStackPosition(3).x) {
                node.getComponent(Poker).reset();
            }
            else {
                stackIndex = this.getWinStackIndex(world.x);
                this.setPokerWinInStack(node, stackIndex);
            }
        }
        else {
            //接龙区
            if(!this.tableauPokerStacks[stackIndex]) {
                this.setPokerTheFirstInStack(node, stackIndex);
            } 
            else if(node == this.tableauPokerStacks[stackIndex]) {
                node.getComponent(Poker).reset();
            }
            else {
                this.movePokerToAnotherStack(node, stackIndex);
            }
        }
    }
    pokerSingleClick(node: cc.Node) {
        this.getThreeCardsAnimation();
    }
    pokerDoubleClick(node: cc.Node) {
        console.log("!! double click")
        let poker = node.getComponent(Poker);
        for(let i = 0; i < this.winPokerStacks.length; i++) {
            if(!this.winPokerStacks[i]) {
                if(poker.point == 1) {
                    poker.moveToWorldPosition(this.getWinStackPosition(i), ()=>{
                        this.setPokerWinInStack(node, i);
                    });
                    return;
                }
            }
            else {
                let winPoker = this.winPokerStacks[i].getComponent(Poker);
                if(winPoker && winPoker.isCenterChild(node)) {
                    poker.moveToWorldPosition(winPoker.getCenterWorldPosition(), ()=>{
                        this.setPokerWinInStack(node, i);
                    });
                    return;
                }
            }
        }

        for(let i = 0; i < this.tableauPokerStacks.length; i++) {
            if(!this.tableauPokerStacks[i]) {
                if(poker.point == 13) {
                    poker.moveToWorldPosition(this.getTableauStackPosition(i), ()=>{
                        this.setPokerTheFirstInStack(node, i);                    
                    });
                    return;
                }
            }
            else {
                let tableauPoker = this.tableauPokerStacks[i].getComponent(Poker);
                if(tableauPoker && tableauPoker.isBottomChild(node)) {
                    poker.moveToWorldPosition(tableauPoker.getBottomWorldPosition(), ()=>{
                        this.movePokerToAnotherStack(node, i);
                    });
                    return;
                }
            }
        }

        poker.shakeAnimation();
    }
}
