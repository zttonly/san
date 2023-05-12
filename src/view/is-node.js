/**
 * Copyright (c) Baidu Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license.
 * See LICENSE file in the project root for license information.
 *
 * @file is 指令节点类
 */

var guid = require('../util/guid');
var evalExpr = require('../runtime/eval-expr');
var NodeType = require('./node-type');
var createNode = require('./create-node');
var createHydrateNode = require('./create-hydrate-node');
var nodeOwnSimpleDispose = require('./node-own-simple-dispose');


/**
 * is 指令节点类
 *
 * @class
 * @param {Object} aNode 抽象节点
 * @param {Node} parent 父亲节点
 * @param {Model} scope 所属数据环境
 * @param {Component} owner 所属组件环境
 * @param {DOMChildrenWalker?} hydrateWalker 子元素遍历对象
 */
function IsNode(aNode, parent, scope, owner, hydrateWalker) {
    this.aNode = aNode;
    this.owner = owner;
    this.scope = scope;
    this.parent = parent;
    this.parentComponent = parent.nodeType === NodeType.CMPT
        ? parent
        : parent.parentComponent;

    this.id = guid++;
    this.children = [];
    this.tagName = this.aNode.tagName;
    // #[begin] hydrate
    if (hydrateWalker) {
        this.cmpt = evalExpr(this.aNode.directives.is.value, this.scope) || this.tagName;
        this.children[0] = createHydrateNode(
            this.aNode.isRinsed,
            this,
            this.scope,
            this.owner,
            hydrateWalker,
            this.cmpt
        );
    }
    // #[end]
}

IsNode.prototype.nodeType = NodeType.IS;

IsNode.prototype.dispose = nodeOwnSimpleDispose;

/**
 * attach到页面
 *
 * @param {HTMLElement} parentEl 要添加到的父元素
 * @param {HTMLElement＝} beforeEl 要添加到哪个元素之前
 */
IsNode.prototype.attach = function (parentEl, beforeEl) {
    this.cmpt = evalExpr(this.aNode.directives.is.value, this.scope) || this.tagName;
    
    var child = createNode(this.aNode.isRinsed, this, this.scope, this.owner, this.cmpt);
    this.children[0] = child;
    child.attach(parentEl, beforeEl);
};

/**
 * 视图更新函数
 *
 * @param {Array} changes 数据变化信息
 */
IsNode.prototype._update = function (changes) {
    var child = this.children[0];
    var cmpt = evalExpr(this.aNode.directives.is.value, this.scope) || this.tagName;

    if (cmpt === this.cmpt) {
        child._update(changes);
    }
    else {
        this.cmpt = cmpt;

        var newChild = createNode(this.aNode.isRinsed, this, this.scope, this.owner, this.cmpt);
        var el = child.el;
        newChild.attach(el.parentNode, el);

        child.dispose();
        this.children[0] = newChild;
    }
};

IsNode.prototype._getElAsRootNode = function () {
    return this.children[0].el;
};

exports = module.exports = IsNode;
