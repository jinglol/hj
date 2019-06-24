function TreeNode(selfId, nodeName, layer) {
	/******参数******/
	this.parentId;	
	this.parentNode;	
	this.childList = [];
	this.nodeList = [];
	/******构造函数部分******/
	this.selfId = selfId;
	this.nodeName = nodeName;
	this.layer = layer;
	/******函数******/
	//initialize the childList
	this.initChildList = function() {
		if (this.childList == null) {
			this.childList = new Array();
		}
	}
	//insert a single child treenode into the current treenode
	this.addChildNode = function(treeNode) {
		this.initChildList();
		this.childList.push(treeNode);
	}
	//return set of fathers of current node
	//返回当前节点的父节点,父亲的父亲。。。
	this.getElders = function() {
		var elderList = new Array();
		var node  = this;
		while(node.getSelfId()!=-1) {
			elderList.push(node.getParentNode());
			node = node.getParentNode();
		}
		return elderList;
	}
	//return set of sons of current node
	 //返回当前节点的所有孩子节点,孩子的孩子,...
	 this.getJuniors = function() {
	 	var juniorList = new Array();
	 	var nodelist = new Array();
	 	var node  = this;	 	
	 	nodelist.push(node);
	 	while( nodelist.length != 0) {
	 		//console.log("typeof(nodelist) : " + typeof(nodelist));
	 		//console.log("typeof(nodelist[0]) : " + typeof(nodelist[0]));
	 		if(nodelist[0].getSelfId()!=-1){
				juniorList.push(nodelist[0]);
			}
			for(var i = 0; i < nodelist[0].childList.length; i++) {
				var childNode = nodelist[0].childList[i];
				//juniorList.add(childNode);
				//console.log("typeof(childNode) : " + typeof(childNode));
				nodelist.push(childNode);
			}
			nodelist.splice(0, 1);
	 	}
	 	return juniorList;
	 }
	 //delete current node and all of its sons
	 this.deleteNode = function() {
	 	var parentNode = this.getParentNode();
	 	var id = this.getSelfId();
	 	if (parentNode != null) {
			parentNode.deleteChildNode(id);
		}
	 }
	 //delete one node from son set of current node
	 this.deleteChildNode = function(childId) {
	 	var childList = this.getChildList();
	 	var childNumber = childList.length;
	 	for (var i = 0; i < childNumber; i++) {
			var child = childList[i];
			if (child.getSelfId() == childId) {
				childList.splice(i, 1);
				return;
			}
		}
	 }
	 //dynamically insert a new node into the current tree
	 this.insertJuniorNode = function(treeNode) {
	 	var juniorParentId =  treeNode.getParentId();
	 	if (this.parentId == juniorParentId) {
			addChildNode(treeNode);
			return true;
		} else {
			var findnode = this.findTreeNodeById(juniorParentId);
			if (findnode != null) {
				findnode.getChildList().push(treeNode);
				return true;
			}
			return false;
		}
	 }
	 //find a certain node of the tree
	 this.findTreeNodeById = function(id) {
	 	if (this.selfId == id)
			return this;
		if (this.childList.isEmpty() || this.childList == null) {
			return null;
		}
		else 
		{
			var childNumber = this.childList.length;
			for (var i = 0; i < childNumber; i++) {
				var child = this.childList[i];
				var resultNode = child.findTreeNodeById(id); //递归查找子树中是否有目标节点
				if (resultNode != null) {
					return resultNode;
				}
			}
			return null;
		}
	 }
	 //traverse the tree，DFS maybe
	 this.traverse = function() {
	 	this.nodeList.push(this);
		if (this.childList == null || this.childList.isEmpty()){
			return;
		}
		var childNumber = this.childList.length;
		for (var i = 0; i < childNumber; i++) {
			var child = this.childList[i];
			this.nodeList.push(child);
			child.traverse();
		}
	 }
	 //traverse the tree, postorder traversal
	 this.traversePostorder = function() {
	 	if (this.childList == null || this.childList.isEmpty()){
//			console.log(this.selfId);
			return;
		}
		var childNumber = this.childList.length;
		for (var i = 0; i < childNumber; i++) {
			var child = this.childList[i];
			child.traverse();
		}
//		console.log(this.selfId);
	 }
	 /*************节点属性操作************/
	 this.getParentId = function() {
	 	return this.parentId;
	 };
	 this.getSelfId = function() {
	 	return this.selfId;
	 };
	 this.getNodeName = function() {
	 	return this.nodeName;
	 };
	 this.getParentNode = function() {
	 	return this.parentNode;
	 };
	 this.setParentNode = function(parentNode) {
	 	this.parentNode = parentNode;
		this.parentId = parentNode.getSelfId();
		this.layer = parentNode.layer+1;
	 };
	 this.getChildList = function() {
	 	return this.childList;
	 };
	 this.setChildList = function(childList) {
	 	this.childList = childList;
	 };
	 this.getLayer = function() {
	 	return this.layer;
	 };
	 this.setChildList = function(layer) {
	 	this.layer = layer;
	 };
	 ////判断节点是否为叶子节点
	 this.isLeaf = function() {
	 	//此函数中关于null,empty,undefined不知是否有争议
	 	if (this.this.childList == null) {
			return true;
		} 
		else 
		{
			if (this.childList.isEmpty()) {
				return true;
			} 
			else 
			{
				return false;
			}
		}
	 };
}

function Tree(troot, step) {
	//参数
	this._nodeList = new Array();
	this._sessionTree = new Array();
	this._sessionList = new Array();
	this._clusterList = new Array();
	//构造函数里面的
	this._root = troot;
	this._step = step;
//	addNodeList(troot);
//	getSession(step);
//	getSessionList(); //新增加的
	//预处理函数
	//function addNodeList()
	this._nodeList.pushAll(troot.getJuniors());
	//function getSession(step)
	for(var i = 0; i < this._nodeList.length; i++) {
		var node = this._nodeList[i];
//			console.log("typeof(node) : " + typeof(node));
//			console.log("node.length : " + node.length);
//			console.log("node.getSelfId() : " + node.getSelfId());
		this._sessionTree[node.getSelfId()] = new SubTree(node, step);
	}
	//function getSessionList()
	for(var i = 0; i < this._nodeList.length; i++) {
		var node = this._nodeList[i];
//			console.log("node.getSelfId() : " + node.getSelfId());///这里之前就出现了问题
		for(var j = 0; j < this._sessionTree[node.getSelfId()]._sessionList.length; j++) {
//			console.log("this._sessionTree[node.getSelfId()]._sessionList.length : " + this._sessionTree[node.getSelfId()]._sessionList.length);
			var se = this._sessionTree[node.getSelfId()]._sessionList[j];
//				console.log("se.id : " + se.id);
			if (se.end != this._step) { // 会话的结束步伐不绘制
				this._sessionList.push(se);
			}
		}
	}
	//外部访问函数
	this.getTotalMember = function() {
		var totalMember = new Array();
		for(var i = 0; i < this._sessionList.length; i++) {
			var seMem = this._sessionList[i].members;
			totalMember.pushAll(seMem);	
		}
		return totalMember;
	}
	this.getSessionEnd = function() {
		var listSession = new Array();
		for(var i = 0; i < this._sessionList.length; i++) {
			var se = this._sessionList[i];
			if (se.end-1 == this._step) { // 会话的结束步伐不绘制
//				console.log(" getSessionEnd() se.id : " + se.id);
				listSession.push(se);
			}
		}
		return listSession;
	}
	this.getSessionStart = function() {
		var listSession = new Array();
		for(var i = 0; i < this._sessionList.length; i++) {
			var se = this._sessionList[i];
			if (se.start == this._step) { // 会话的结束步伐不绘制
//				console.log(" getSessionStart() se.id : " + se.id);
				listSession.push(se);
			}
		}
		return listSession;
	}
}

function SubTree(_subRoot, _step) {
	//参数	
	this._sessionList = new Array();
	this._entityList = new Array();		
	//构造函数
	this._step = _step;
	this._subRoot = _subRoot;
//	getSessionList(_subRoot,_step);
//	initMemberOrder();
	//函数
//	function getSessionList(_subRoot, _step)
	var loc = LocationList[_subRoot.getSelfId()];
//		console.log("_subRoot.getSelfId() : " + _subRoot.getSelfId());
//		console.log(_step + " findddddddddddddddddd_step : ");
	////////////////////////////////////////////这里判断不成功
	if(loc.getInterStep(_step)!=null){
//		console.log(_step + " _step : " + "loc.getInterStep(step)!=null ");
		//this._sessionList=loc.getInterStep(step)._sessionList;
		//this._sessionList.splice(0, this._sessionList.length);
//		console.log("loc.getInterStep(_step)" + typeof(loc.getInterStep(_step)));
//		console.log("typeof(loc.getInterStep(step)._sessionList)" + typeof(loc.getInterStep(step)._sessionList));
		this._sessionList.pushAll(loc.getInterStep(_step)._sessionList);	
	}

//	function initMemberOrder() {
//	this._entityList.splice(0, this._entityList.length);
	for(var i = 0; i < this._sessionList.length; i++) {
		var seMem = this._sessionList[i].members;
		this._entityList.pushAll(seMem);
	}
	//外部访问函数
	this.adjustOrder = function() {
		this._entityList.splice(0, this._entityList.length);
		for(var i = 0; i < this._sessionList.length; i++) {
			var seMem = this._sessionList[i].members;
			this._entityList.pushAll(seMem);
		}
	}
}

//
function Location(id, name) {
	this.id = id;
	this.name = name;
	this.LocChilds = new Array();
	this.InterSession = new Array();
	this.InterMember = new Array();
	this.parent;
	this.interslot = new Array();
	this.interslotOfall = new Array();
	this._stepList = new Array();
	this.interStep = new Array();

	var countMember = 0;
	this.getChild = function(loc) {
		if(arguments.length)
			this.LocChilds.push(loc);
	}
	this.setInterSession = function(se) {
		this.InterSession.push(se);
	}
	this.getInterSlot = function() {
		for (var i = 0; i < this.InterSession.length; i++) {
			var se = this.InterSession[i];
//			console.log( i + " se.id : " + se.id);
			for(var j = 0; j < se.members.length; j++) {
				var memberNew = se.members[j];
				var flag = false; // 访问控制符
				for(var k = 0; k < this.interslot.length; k++) {
					var slotExist = this.interslot[k];
					if (slotExist.member == memberNew) {
						this.interslot[slotExist.id].sessions.push(se);
						flag = true;
						break;
					}
				}
				if (flag == false) {
					this.interslot.push(new InterSlot(this.interslot.length, memberNew, se,this.id));
					this.InterMember.push(memberNew);
				}
			}
		}
	}
	this.getCountMember = function() {
		this.interslotOfall = this.interslot;
		countMember = this.interslot.length;
		for(var i = 0; i < this.LocChilds.length; i++) {
			var loc = this.LocChilds[i];
			for(var j = 0; j < loc.interslot.length; j++) {
				var slotOfloc = loc.interslot[j];
				var flag = false;
				for(var k = 0; k < this.interslotOfall.length; k++) {
					var slotOfthis = this.interslotOfall[k];
					if (slotOfthis.member == slotOfloc.member) {
						flag = true;
						slotOfthis.sessions.pushAll(slotOfloc.sessions); // 将孩子节点的片段存在另一个数组中
						break;
					}
				}
				if (flag == false) {
					this.interslotOfall.push(new InterSlot(this.interslotOfall.length,
					slotOfloc.member, slotOfloc.sessions,this.id)); // 存储孩子节点中的实体片段
					this.InterMember.push(slotOfloc.member);
					countMember += 1;
				}
			}
		}
		for(var n = 0; n < this.interslotOfall.length; n++) {
			var interslot = this.interslotOfall[n];
			interslot.getSeTime(); 
		}
		return countMember;
	}
	this.getTimeBound = function() {
		var _start = this.InterSession[0].start;
		var _end = this.InterSession[0].end;
//		console.log("this.InterSession[0].id : " + this.InterSession[0].id);
//		console.log("this.InterSession[0].start : " + this.InterSession[0].start);
//		console.log("this.InterSession[0].end : " + this.InterSession[0].end);
		var timeSlot = new Start_Stop(_start, _end);// 初始化
		for(var i = 0; i < this.InterSession.length; i++) {// 场景时间可能是不连续的，如场景0,2,6
			var se = this.InterSession[i];
			if (se.start >= timeSlot.start && se.start <= timeSlot.end) {
				if (se.end > timeSlot.end) {
//					console.log("se.end : " + se.end + "timeSlot.end : " + timeSlot.end);
					timeSlot.end = se.end;
				}
			} else {
				this._stepList.push(timeSlot);
//				console.log("se.end : " + se.end + "timeSlot.end : " + timeSlot.end);
				timeSlot = new Start_Stop(se.start, se.end);
			}
		}
		this._stepList.push(timeSlot);
	}
	this.isContain = function(timeStep) {
		for(var i = 0; i < this._stepList.length; i++) {
			var timeSlot = this._stepList[i];
			if (timeSlot._isInSlot(timeStep)) {
				return true;
			}
		}
		return false;
	}
	this.getInterStep = function(_step) {
		var _interstep;
		for(var i = 0; i < this.interStep.length; i++) {
//			console.log("this.interStep.length : " + this.interStep.length);
			_interstep = this.interStep[i];
//			console.log("_interstep.step : " + _interstep.step + " _step : " + _step);
			//////////////////这里的_interstep.step是undefined
			if(_interstep.step == _step){
//				console.log("return _interstep" );
				return _interstep;
			}
		}
		return null;
	}
}

//
// function Session(ID, START, END, START_JH, END_JH, MEMBER) {
	function Session(ID, START, END, MEMBER) {
	//参数
	this.location = new Location();
	this.members = new Array();
	this.higherCluter = new Array();
	this.lowerCluter = new Array();
	this.currentCluter = new Cluster();
	//构造函数
	this.id=ID;
	this.start=START;
//	console.log("Session.this.start : "+this.start);
	this.end=END;
	// this.start_jh=START_JH;
	// this.end_jh=END_JH;	
	this.members = MEMBER;
	this.left_x=this.start*Property.TIMESTEP_WIDTH+Property.MARGIN_LEFT;
//	console.log("Property.TIMESTEP_WIDTH : "+Property.TIMESTEP_WIDTH);
	// console.log("Session "+ this.id+ " .left_x : "+this.left_x);
	this.left_y=0;
	this.height= this.members.length*Property.TUBE_WIDTH+(this.members.length+1)*Property.TUBE_SPACE;
	this.width=(this.end-this.start-1)*Property.TIMESTEP_WIDTH;

	this.left_x_jh=this.start_jh*Property.TIMESTEP_WIDTH+Property.MARGIN_LEFT;
	// this.left_y_jh=0;
	// this.height_jh= this.members.length*Property.TUBE_WIDTH+(this.members.length+1)*Property.TUBE_SPACE;
	this.width_jh=(this.end_jh-this.start_jh-1)*Property.TIMESTEP_WIDTH;
	
	this.align=false;
	this.currentCluter=null;
	this.weight=0;
	//函数
	this.setWeight = function(weight) {
		this.weight = weight;
	}
	this.isContain = function(timestep) {
		if(timestep>=this.start && timestep<this.end){
			return true;
		}
		return false;
	}
	this.overlap_se = function(se) {
		if(this.start>=se.end || this.end<=se.start)
			return false;
		else
			return true;
	}
}

//
function Member(ID, NAME, COLOR) {
	//参数
	this.sessionTube = new Array();
	this.coor_x;
	this.coor_y;
	//构造函数
	this.id=ID;
	this.name=NAME;
	this.color=COLOR;
	//函数
	this.getLocation = function(step) {
		for(var i = 0; i < LocationNode.length; i++) {
			var node = LocationNode[i];
			var loc = LocationList[node.getSelfId()];
			if(loc.isContain(step)){
				if((new SubTree(node,step)._entityList.contains(this))){
					return node;
				}
			}
		}
		return null;
	}
	this.addSessionTube = function(se) {
		this.sessionTube.push(se);
		return this.sessionTube;
	}
	
	this.computeCoor = function() {
//		this.coor_x = new Array(2*(this.sessionTube.length-1));
//		this.coor_y = new Array(this.sessionTube.length);
		this.coor_x = new Array();
		this.coor_y = new Array();
		for(var i = 0; i < 2*(this.sessionTube.length-1); i++) {
			this.coor_x[i] = 0;
		}
		for(var i = 0; i < this.sessionTube.length; i++) {
			this.coor_y[i] = 0;
		}
//		console.log("this.sessionTube.length : " + this.sessionTube.length);
		for(var index = 0; index < this.sessionTube.length; index++){
			var se = this.sessionTube[index];
			this.coor_y[index] = se.left_y + se.members.indexOfId(this)
					* Property.TUBE_WIDTH + (se.members.indexOfId(this) + 1)
					* Property.TUBE_SPACE;
			if(index > 0 && index < this.sessionTube.length-1){
//				console.log("this.coor_x[2*index-1] : " + (2*index-1));
//				console.log("this.coor_x[2*index] : " + (2*index));
//				console.log("se.left_x : " + se.left_x);
//				console.log("se.width : " + se.width);
//				console.log("se.left_x + se.width : " + (se.left_x + se.width));
				this.coor_x[2*index-1] = se.left_x;
				this.coor_x[2*index] = se.left_x + se.width;					
			} else {
				if(index == 0){
					this.coor_x[0] = se.left_x + se.width;
				} else {
					this.coor_x[2*index-1] = se.left_x;
				}
			}
		}
	}
///////////////////////////////////////////////////////
	// this.coordinate = new Array();
	// this.computeCoor = function() {
	// 	console.log("caculateCoor");
	// 	for(var index = 0; index < this.sessionTube.length; index++){
	// 		var se = this.sessionTube[index];
	// 		var mIs = se.members.indexOfId(this)
	// 		var coor_y = se.left_y +  mIs * Property.TUBE_WIDTH + (mIs+1) * Property.TUBE_SPACE;
	// 		var coor_x1 = se.left_x;
	// 		var coor_x2 = se.left_x + se.width;;
	// 		this.coordinate.push({x: coor_x1, y: coor_y});
	// 		this.coordinate.push({x: coor_x2, y: coor_y});
	// 	}
	// };
}

function InterStep(step, loc) {
	//参数
	this._sessionList = new Array();
	//构造函数
	this.step = step;
	this.loc = loc;
//	getSession(step, loc);
	//函数
//	function getSession(step, loc) 
//		console.log("InterStep.step :" + this.step);
//		console.log("loc.InterSession.length : " + loc.InterSession.length)
	for(var i = 0; i < loc.InterSession.length; i++) {
		var se = loc.InterSession[i];
//			console.log("se.id : " + se.id)
//			console.log("se.id : " + se.id + ", step :" + step);
		if(se.isContain(step)){
//			console.log("InterStep se.isContain(step) ");
//			console.log("se.id : " + se.id + ", step :" + step);
			this._sessionList.push(se);
		}
	}
}