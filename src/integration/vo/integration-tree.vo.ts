/**
 * 集成树形结构
 * @author: clboy
 * @date: 2023-12-05 20:55:05
 * @Copyright (c) 2023 by syl@clboy.cn, All Rights Reserved. 
 */
import { Integration } from "../entities/integration.entity";

export class IntegrationTreeNode extends Integration {

    children: IntegrationTreeNode[];


    public static buildTree(items: Integration[]): IntegrationTreeNode[] {
        const tree: IntegrationTreeNode[] = [];
        const treeNodeList = items.map(item => IntegrationTreeNode.from(item));
        treeNodeList.sort((a, b) => a.sortValue - b.sortValue);
        for (const treeNode of treeNodeList) {
            if (treeNode.folderId === '0') {
                tree.push(treeNode);
            } else {
                const parentNode = treeNodeList.find(n => n._id === treeNode.folderId);
                if (parentNode) {
                    parentNode.children.push(treeNode);
                }
            }
        }
        return tree;
    }

    private static from(integration: Integration): IntegrationTreeNode {
        const node = new IntegrationTreeNode();
        Object.assign(node, integration);
        node.children = [];
        if (!node.folderId) {
            node.folderId = '0';
        }
        return node;
    }

}