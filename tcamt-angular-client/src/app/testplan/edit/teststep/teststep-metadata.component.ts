import { Component, OnInit } from '@angular/core';
import {TestplanService} from '../../../service/testplanservice';
import {TreeNode,SelectItem} from 'primeng/primeng';

@Component({
    templateUrl: './teststep-metadata.component.html'
})

export class TeststepMetadataComponent implements OnInit {

    files5: TreeNode[];
    cate: SelectItem[];
    messageString : string;

    constructor(private testplanService: TestplanService) {
        this.cate = [
            {label:'Select Categorization', value:null},
            {label:'PresenceCheck', value:{id:1, name: 'PresenceCheck', code: 'PresenceCheck'}},
            {label:'NotPresenceCheck', value:{id:3, name: 'NotPresenceCheck', code: 'NotPresenceCheck'}},
            {label:'DataCheck', value:{id:2, name: 'DataCheck', code: 'DataCheck'}}
        ];
    }

    ngOnInit() {
        this.testplanService.getFilesystem().then(files => this.files5 = files);
    }

    isLeafNode(node:any) :boolean {
        if(!node.children || node.children.length === 0) return true;
        else {
            let inner: boolean = true;
            node.children.forEach( function (arrayItem)
            {
                if(arrayItem.data.name && arrayItem.data.name.indexOf("@") === -1){
                    if(inner) inner = false;
                }
            });
            return inner;
        }
    }

    submitMessage(){
        var text, parser, xmlDoc;
        parser = new DOMParser();
        xmlDoc = parser.parseFromString(this.messageString,"text/xml");
        var path = xmlDoc.documentElement.nodeName;
        this.visitXML(path, xmlDoc.documentElement.childNodes);
    }

    visitXML(path, nodes) {
        if(nodes){
            for (var i = 0; i < nodes.length ;i++) {
                var node = nodes[i];
                var nodePath = path + "/" + node.nodeName;
                if(nodePath.indexOf("#text") > -1 && node.nodeValue && node.nodeValue.trim() != ""){
                    this.insertData(path, node.nodeValue);
                }
                this.visitXML(nodePath, node.childNodes);

                if(node.attributes){
                    for (var j = 0; j < node.attributes.length; j++){
                        var att = node.attributes[j];
                        this.insertData(nodePath + "/@" + att.nodeName, att.nodeValue);
                    }
                }

            }
        }
    }

    insertData(path, data){
        if(this.files5){
            this.visitTree(this.files5, path, data);
        }
    }

    visitTree(treedatalist, path, data){
        for (var i = 0; i < treedatalist.length ;i++) {

            if(path === treedatalist[i].data.path){
                treedatalist[i].data.testdata = data;
            }else {
                if(treedatalist[i].children) {
                    this.visitTree(treedatalist[i].children, path, data);
                }
            }

        }
    }
}