Array.prototype.pushAll = function(addlist) {
	if(addlist.length != 0) {
		for(var i = 0; i < addlist.length; i++) {
			this.push(addlist[i]);
		}
	}	
}
Array.prototype.indexOfId = function(element) {
	for(var i = 0; i < this.length; i++) {
		if(this[i].id == element.id) {
//			console.log("find element.id : " + element.id + " , i : " + i);
			return i;
		}
	}
	return -1;
}
function LocationLayout() {
	var BACKGROUND_COLOR = d3.rgb(255,255,255);
	var TUBE_BACK_COLOR = d3.rgb(220,220,220);

	var col = new Array();
	var errorCount = 0;
	var axisCoordinate;
	var rows = [];
	LocationList = new Array();	//设置成全局的吧
	var SessionList = new Array();
	MemberList = new Array();
	LocationNode = new Array();
	var treeNodeRoot = new TreeNode(-1, "ROOT", -1); //root

	// 存储每个时间步上的关系树Tree[] relationTreeList = new Tree[Property.TIMESTEP_SIZE];
	var relationTreeList = new Array();
	var alignPairs = new Array();
	var cluster = new Array();
	var seExtra = new Array();

//	var colors = d3.scale.category20();
	var colors = new Array();
  colors[0] = d3.rgb(79,140,157);
  colors[1] = d3.rgb(124,211,235);
  colors[2] = d3.rgb(184,226,125);
  colors[3] = d3.rgb(63,90,41);
  colors[4] = d3.rgb(89,162,12);
//  colors[2] = d3.rgb(225,225,225);
//  colors[3] = d3.rgb(225,225,225);
///  colors[4] = d3.rgb(225,225,225);
  colors[5] = d3.rgb(247,147,2);
  colors[6] = d3.rgb(191,130,102);
  colors[7] = d3.rgb(129,65,26);
  colors[8] = d3.rgb(242,205,185);
  colors[9] = d3.rgb(135,49,194);
  colors[10] = d3.rgb(253,156,186);
  colors[11] = d3.rgb(227,58,185);
  colors[12] = d3.rgb(254,29,102);
  colors[13] = d3.rgb(221,29,52);
	var _svg;

	//绘制函数
	function render() {
		if(!_svg) {
         /*创建画布_svg*/
         _svg = d3.select("#chart")
               .append("svg")
               .attr("class", "svg")
               .attr("height", Property.SCREEN_HEIGHT)
               .attr("width", Property.SCREEN_WIDTH + Property.MARGIN_LEFT);
        }
        loadDataDraw(_svg);
	}
	function loadDataDraw(svg){
		//读取Location数据并存储
		//function getLocations()
			var locs = d["locations"];
			for(var i = 0; i < locs.length; i++) {
				LocationList.push(new Location(locs[i].id, locs[i].name));
			}

			//读取人员数据并存储
			//function getMember()
			//jscenes对象存入文件中scenes标记的数据
			var mems = d["members"];
			for(var i = 0; i < mems.length; i++) {
		//		MemberList.push(new Member(mems[i].id, mems[i].name, colors(mems[i].id))); 
				MemberList.push(new Member(mems[i].id, mems[i].name, colors[mems[i].id])); 
			}

			////读取会话数据并存储
			//function getSession()
			var ses = d["sessions"];
			////参数设置
			Property.TIMESTEP_SIZE = ses[ses.length-1].end + 1;
			Property.TIMESTEP_WIDTH = parseFloat(Property.SCREEN_WIDTH / Property.TIMESTEP_SIZE);
			//Property.TIMESTEP_WIDTH = 24;
			console.log(Property.TIMESTEP_SIZE + " "+Property.TIMESTEP_WIDTH);
			for(var i = 0; i < ses.length; i++) {						
				var member = ses[i].members;
				var interMember = new Array();
				for(var j = 0; j < member.length; j++) {
					interMember.push(MemberList[member[j]]);
				}
				// var se = new Session(ses[i].id, ses[i].start, ses[i].end, ses[i].start_jh, ses[i].end_jh, interMember);

				var se = new Session(ses[i].id, ses[i].start, ses[i].end, interMember);

				for(var j = 0; j < interMember.length; j++) {
					interMember[j].addSessionTube(se);
				}
				LocationList[parseInt(ses[i].location)].setInterSession(se);
				se.location = LocationList[parseInt(ses[i].location)];
				SessionList.push(se);
				// console.log("input se: " + member);
//				console.log("getSession se.start" + se.start);
			}

			//数据载入完毕后进行数据处理工作
			setup(svg);
	}
	//数据准备工作
	function setup(svg) {
		//数据预处理过程
		getLocInterStep(); // 场景时间步伐 会话集合

		createLocTree(); // 手工输入location tree
		createRelationTree(); // 在每个时间步伐创建relation tree

		getInterslot();

		//算法过程
		//Collections.swap(root.childList,0,2);
		// collectionsSwap(treeNodeRoot.childList, 0, 2);

		orderRelationTree();
		alignSession();
		
		// matchPair(alignPairs);

		//纵轴方向上将session纵向排开，不然纵向会挤在一起

		getCluster();
		putClusters();

		//对没有对齐的Session再进行一个调整，减少会话间距?这一部分先不实现吧？
//		adjustSeExtra(); //调整seExtra的坐标位置
//		adjustMinDistance();//会话之间最小距离的调整

		//数据处理后进行绘制工作，不然数据异步传输
		draw(svg);
	}
	function draw(svg) {
		drawTimeLine(svg);
		
		drawPlanSessionLabel(svg);
		drawLines(svg);
		drawLineLable(svg);
		drawSessionLabel(svg);
//		drawBezier(svg);
//		drawLabelName(svg);
	}
	/***********************数据准备工作函数*************************/
	//
	function getLocInterStep() {
		for(var i = 0; i < LocationList.length; i++) {
			var loc = LocationList[i];
			loc.getTimeBound();//////////////出现了同名函数,但是在不同闭包中,是否会出错?
			for(var j = 0; j < loc._stepList.length; j++) {
				var timeSlot = loc._stepList[j];
				for (var k = timeSlot.start; k <= timeSlot.end; k++) {
//					console.log("timeSlot.start : " + timeSlot.start + " timeSlot.end : " + timeSlot.end);
					loc.interStep.push(new InterStep(k, loc));

				}
			}
//			console.log("loc.interStep.length : " + loc.interStep.length);
		}
	}
	//手工创建locationTree
	function createLocTree() {
		for(var i = 0; i < LocationList.length; i++) {
			var loc = LocationList[i];
			var childNode = new TreeNode(loc.id, loc.name, 0);
			LocationNode.push(childNode);
		}

		treeNodeRoot.addChildNode(LocationNode[0]);
		LocationNode[0].setParentNode(treeNodeRoot);		

		treeNodeRoot.addChildNode(LocationNode[1]);
		LocationNode[1].setParentNode(treeNodeRoot);

		treeNodeRoot.addChildNode(LocationNode[2]);
		LocationNode[2].setParentNode(treeNodeRoot);

//		treeNodeRoot.addChildNode(LocationNode[3]);
//		LocationNode[3].setParentNode(treeNodeRoot);
		
//		findChildLocation(treeNodeRoot); // 将树节点对应的场景节点的孩子节点找到
	}
	/*
	function findChildLocation(node) {
		var selfId = node.getSelfId();
		var childList = node.getChildList();
		if (selfId >= 0) {
			if (childList.length > 0) {
				for(var i = 0; i < childList.length; i++) {
					var nodeChild = childList[i];
					LocationList[selfId].getChild(
							LocationList[selfId]);
					findChildLocation(nodeChild);
					LocationList[selfId].getChild(
							LocationList[selfId].LocChilds);
				}
			}
		} else if (childList.length > 0) {
			for(var j = 0; j < childList.length; j++) {
				var nodeChild = childList[j];
				findChildLocation(nodeChild);
			}
		}
	}
	*/
	//
	function createRelationTree() {
		for (var index = 0; index < Property.TIMESTEP_SIZE; index++) {
//			console.log("createRelationTree.index : " + index);
			relationTreeList[index] = new Tree(treeNodeRoot, index);
		}
	}
	//
	function getInterslot() {
//		console.log("getInterslot");
		for(var i = 0; i < LocationList.length; i++) {
			LocationList[i].getInterSlot();
		}
		for(var i = 0; i < LocationList.length; i++) {
			LocationList[i].getCountMember();
		}
	}
	/***********************自写辅助函数*************************/
	//自写的swap函数
	function collectionsSwap(list, i, j) {
//		console.log("collectionsSwap");
		var temp = list[i];
		list[i] = list[j];
		list[j] = temp;
	}
	/***********************算法调整工作函数*************************/
	//开始扫描啦
	function orderRelationTree() {
		// 设置扫描迭代次数上限为20
		for (var iterator = 0; iterator < 10; iterator++) {
//			console.log("orderRelationTree : " + iterator);
			sweepingPositive();
			sweepingInverted();
		}
	}
	//正序扫描
	function sweepingPositive() {
		if(arguments.length == 0) {			//sweepingPositive()
//			console.log("sweepingPositive length = 0");
			//对每一个时间步进行
			for (var index = 1; index < Property.TIMESTEP_SIZE-1; index++) {
				sweepingPositive(index);
				adjustOrding(index);
			}
		} else if(arguments.length == 1) {		//sweepingPositive(int index)
//			console.log("sweepingPositive length = 1");
			var index = arguments[0];
			var former = index - 1;

			var referList = relationTreeList[former].getTotalMember();
			var relationTree = relationTreeList[index];

			for(var i = 0; i < treeNodeRoot.childList.length; i++) {
//				console.log("treeNodeRoot.childList.length : " + treeNodeRoot.childList.length);
				var nodeParent = treeNodeRoot.childList[i]; 
				var seCurrent = new Array();
				seCurrent.pushAll(relationTree._sessionTree[nodeParent.getSelfId()]._sessionList);

				for(var j = 0; j < seCurrent.length; j++) {
//					console.log("diaoyong 3 element sweepingPositive : " + index);
					sweepingPositive(referList, seCurrent[j], index);
				}
			}

		} else if(arguments.length == 3) {		//sweepingPositive(List<Member> refer, Session se, int index)
//			console.log("sweepingPositive length = 3");
			var refer = arguments[0];
			var se = arguments[1];
			var index = arguments[2];

			var comparator = new ComparatorMemberPosInv(refer);
//			console.log("refer.length : "+refer.length+" , index: "+index +" , se.id" + se.id);

			if(index == se.start) {
				se.members.sort(comparator.comparePosInv);
				se.weight = 0;
				var count = 0;
				//step3
				for(var i = 0; i < se.members.length; i++) {
					var member = se.members[i];
//					console.log(" index =  "+ i +", member.id : "+member.id);
					count=0;
					if(refer.indexOfId(member)==-1){
						/*
						if(member.id==5||member.id==8 || member.id==7) {
							//se.weight +=member.id;
							se.weight+=-2;
						// if(member.id==12 || member.id==5 || member.id==6 || member.id==8|| member.id==7 || member.id==13){
						// 	se.weight+=5;
							count++;
						}else{
							se.weight += 0;
						}
						*/
						// se.weight += 0;
						if(member.id==0||member.id==1 || member.id==13) {
							se.weight +=10;
							//se.weight+=-2;
							//se.weight+=5;
							count++;
						}else{
							se.weight += 0;
						}
					}else{
						count++;
						se.weight += refer.indexOfId(member)+1;
					}
				}

				se.weight = se.weight / count;
//				console.log("index == se.start se.weight : "+se.weight+", index: "+index);
			} else {
				se.weight = 0;
				for(var j = 0; j < se.members.length; j++) {
					var member = se.members[j];
					se.weight += refer.indexOfId(member) + 1;
				}
				se.weight=se.weight/se.members.length;
//				console.log("index !!!!!= se.start se.weight : " + se.weight+", index: "+index);
			}
		}		
	}
	//倒序扫描
	function sweepingInverted() {
		if(arguments.length == 0) {
			for (var index = Property.TIMESTEP_SIZE - 3; index >= 0; index--) {
				sweepingInverted(index);
				adjustOrding(index);
			}
		} else if(arguments.length == 1) {
			var index = arguments[0];
			var latter = index + 1;

			var referList = relationTreeList[latter].getTotalMember();
			var relationTree = relationTreeList[index];

			for(var i = 0; i < treeNodeRoot.childList.length; i++) {
				var nodeParent = treeNodeRoot.childList[i];
				var seCurrent = new Array();
				seCurrent.pushAll(relationTree._sessionTree[nodeParent.getSelfId()]._sessionList);
				for(var j = 0; j < seCurrent.length; j++){
//					console.log("diaoyong 3 element sweepingInverted : " + index);
					sweepingInverted(referList, seCurrent[j], index);
				}
			}
		} else if(arguments.length == 3) {
			var refer = arguments[0];
			var se = arguments[1];
			var index = arguments[2];

//			console.log("refer.length : " + refer.length);
			var comparator = new ComparatorMemberPosInv(refer);

			if(index + 1 == se.end) {
				se.members.sort(comparator.comparePosInv);
				se.weight = 0;
				var count = 0;
				//step3
				for(var i = 0; i < se.members.length; i++) {
					var member = se.members[i];
					if(refer.indexOfId(member)==-1){
						/*
						if(member.id==5 ||member.id==8 || member.id==7) {
							//se.weight +=member.id;
							se.weight+=-2;
						// if(member.id==12 || member.id==5 || member.id==6 || member.id==8|| member.id==7 || member.id==13){
						// 	se.weight+=5;
							count++;
						}else{
							se.weight += 0;
						}*/
						// se.weight += 0;
						if(member.id==0||member.id==1 || member.id==13) {
							se.weight +=10;
							//se.weight+=-2;
							//se.weight+=5;
							count++;
						}else{
							se.weight += 0;
						}
					}else{
						count++;
						se.weight += refer.indexOfId(member)+1;
					}
				}
				se.weight = se.weight / count;
				SessionList[se.id].setWeight(se.weight);
			} else {
				se.weight = 0;
				for(var j = 0; j < se.members.length; j++) {
					var member = se.members[j];
					se.weight += refer.indexOfId(member) + 1;
				}
				se.weight = se.weight/se.members.length;
				SessionList[se.id].setWeight(se.weight);
			}
		}
	}
	//重心法
	function adjustOrding(index) {
		var relationTree = relationTreeList[index];
		var comparator = new ComparatorSession();
		//relationTree._sessionList.clear();
		relationTree._sessionList.splice(0, relationTree._sessionList.length);

		for(var i = 0; i < treeNodeRoot.childList.length; i++) {
			var nodeParent = treeNodeRoot.childList[i];
			var subtreeCurrent=new Array();
			var seCurrent=new Array();
			subtreeCurrent.push(relationTree._sessionTree[nodeParent.getSelfId()]);
			for(var j = 0; j < subtreeCurrent.length; j++) {
				var subtree = subtreeCurrent[j];
				subtree._sessionList.sort(comparator.compareSe);
				subtree.adjustOrder(); // 根据调整后的sessionlist调整memberlist
				seCurrent.pushAll(subtree._sessionList);
			}			
			relationTree._sessionList.pushAll(seCurrent);
		}

	}
	/************************Align*****************************/
	function alignSession() {
		var SL = new Array();
		var SR = new Array();

		for(var step = 0; step < Property.TIMESTEP_SIZE-2; step++) {
			SL.splice(0, SL.length);
			SR.splice(0, SR.length);

			SL.pushAll(relationTreeList[step].getSessionEnd());
			SR.pushAll(relationTreeList[step+1].getSessionStart());
			//same
			// console.log("SL.length : " + SL.length + ",  SR.length : " + SR.length);
			if(SL.length==0 || SR.length==0){
				continue;
			}
			//匹配
			match(SL,SR,step);
		}
	}
	function match(SL, SR, step) {
		var SLArray = SL;
		var SRArray = SR;
		//二维数组声明=.=
		var b = new Array();
		for(var i = 0; i < SLArray.length + 1; i++) {
			b[i] = new Array();
			for(var j = 0; j < SRArray.length + 1; j++) {
				b[i][j] = 0;
			}
		}
		//
		var left = relationTreeList[step]._sessionList;
		var right = relationTreeList[step+1]._sessionList;

//		console.log("step : " + step);
//		console.log(" relationTreeList[step]._sessionList.length : "+ left.length);
//		console.log(" relationTreeList[step+1]._sessionList : "+ right.length);
		//retain
		var common = new Array();
		common.pushAll(left)
		common = common.filter(function (se) {
			return (right.indexOfId(se) == -1)?false:true;
		});

		LCS.lcsLength(SLArray, SRArray, b);

		var lcsPair = LCS.lcsPair;
		var pair = new AlignPair(step);

		for(var index = 0; index < lcsPair.lList.length; index++){
			var li = lcsPair.lList[index];
			var rj = lcsPair.rList[index];
			var flag = true;
			for(var j = 0; j < common.length; j++) {
				var se = common[j];
				if ((left.indexOfId(se) - left.indexOfId(SLArray[li]))
						* (right.indexOfId(se) - right.indexOfId(SRArray[rj])) < 0) {
					flag=false;
				}
			}
			if(flag==true){
				pair.addPair(SLArray[li],SRArray[rj]);
			}
		}
		alignPairs.push(pair);

	}
	////////////
	function matchPair(alignpair) {
		for(var i = 0; i < alignpair.length; i++) {
			var pair = alignpair[i];
			var time = pair.step;
			for(var mark = 0; mark < pair.lList.length; mark++){
				matchPt(pair.lList[mark],pair.rList[mark],time);
			}
		}
	}
	var seList = new Array();
	function matchPt(s0, s1, step) {
		console.log("hahahaahhha: " + step);
		if (s0.left_y > s1.left_y) {
			var D_value = parseFloat(s0.left_y - s1.left_y);
			seList.splice(0, seList.length);
			adjustCoor(s1);
			console.log("s1.id: " + s1.id);
			// adjustCoor2(D_value, step);
		} else if (s0.left_y < s1.left_y) {
			var D_value = parseFloat(s1.left_y - s0.left_y);
			seList.splice(0, seList.length);
			adjustCoor(s0);
			console.log("s0.id: " + s0.id);
			// adjustCoor2(D_value, step);
		}
	}
	function adjustCoor(se) {
		for (var time = se.start; time < se.end; time++) {
			var share1 = new Array();
			var share2 = new Array();
			if(seList.indexOfId(se) == -1){
				seList.push(se);
			}
			share1.pushAll(seList);
			var mark=relationTreeList[time]._sessionList.indexOfId(se);
			share2.pushAll(relationTreeList[time]._sessionList.slice(mark+1,
					relationTreeList[time]._sessionList.length));
			//share2中除去与share1相等的部分
			share2 = share2.filter(function (s) {
		      	return (share1.indexOfId(s) == -1)?true:false;
		    });
			seList.pushAll(share2);
			for(var i = 0; i < share2.length; i++) {
				adjustCoor(share2[i]);
			}
		}
	}
	////////getCluster
	function isEqual(se0, se1) {
		return se0.id == se1.id;
	}
	function getCluster() {
		// console.log("alignPairs.length: "+alignPairs.length);
		// for(var i = 0; i < alignPairs.length;i++) {
		// 	console.log("alignPair["+ i + "]: " + alignPairs[i].step);
		// }//same
		for(var i = 0; i < alignPairs.length; i++) {
			var pair = alignPairs[i];
			var index=0;
			while(index < pair.lList.length){
				var flag = false;
				for(var j = 0; j < cluster.length; j++) {
					var clu = cluster[j];
					//if(clu.getLatest().equals(pair.lList[index])){
					if(isEqual(clu.getLatest(), pair.lList[index])){
						clu.ClusterSe.push(pair.rList[index]);
						SessionList[pair.rList[index].id].align = true;
						flag = true;
					}
				}
				if(flag==false){
					cluster.push(new Cluster(cluster.length));
					cluster[cluster.length-1].ClusterSe.push(pair.lList[index]);
					SessionList[pair.lList[index].id].align = true;
					
					cluster[cluster.length-1].ClusterSe.push(pair.rList[index]);
					SessionList[pair.rList[index].id].align = true;

					////nosame
					// console.log("pair.lList[index].id: "+ pair.lList[index].id + ", pair.rList[index].id: " + pair.rList[index].id);
				}
				index++;
			}
		}
		compute();		
		layup();
	}
	function compute() {
		for(var i = 0; i < cluster.length; i++) {
			var clu = cluster[i];
			clu.getDiffValue(); //计算Cluster内部Session与top的间距
			clu.left = clu.ClusterSe[0].left_x;
			clu.start = clu.ClusterSe[0].start;
			clu.right = clu.getLatest().left_x + clu.getLatest().width;
			clu.end = clu.getLatest().end-1;
			for(var j = 0; j < clu.ClusterSe.length; j++) {
				var se = clu.ClusterSe[j];
				se.currentCluter = clu;
				if(clu.height < se.height){
					clu.height = se.height;
				}
			}
		}
	}
	function layup() {
		for(var i = 0; i < SessionList.length; i++) {
			var se = SessionList[i];
			if(se.align==false){
				console.log("seExtra.push(se): " + se.id);
				seExtra.push(se);
			}
		}
	}
	////////putClusters
	function putClusters() {////nosame
		for (var index = 0; index < Property.TIMESTEP_SIZE - 1; index++) {
			for(var i = 0; i < relationTreeList[index]._sessionList.length; i++) {
				var se = relationTreeList[index]._sessionList[i];
				var relationTree = relationTreeList[index];
				if (seExtra.indexOfId(se) != -1) {
					relationTree._clusterList.push(se);
					// console.log("relationTree._clusterList.add(se) : " + se.id);
				} else {
					for(var j = 0; j < cluster.length; j++) {
						var clu = cluster[j];
						if (clu.ClusterSe.indexOfId(se) != -1) {
							relationTree._clusterList.push(clu);
							// console.log("relationTree._clusterList.add(clu) : " + clu.id);
							break;
						}
					}					
				}
			}
		}
		fixCluster(); //

		// SessionList[11].left_y -= 50; 
		// SessionList[10].left_y += 50; 
		// SessionList[15].left_y -= 50; 
		// SessionList[14].left_y += 10;
	}
	function fixCluster() {
		for (var index = 1; index < Property.TIMESTEP_WIDTH - 1; index++) {
			sweepingPositive(index);
		}
		for (var index = Property.TIMESTEP_SIZE - 3; index >= 0; index--) {
			sweepingInverted(index);
		}
		fixPos();
		fixInv();
	}
	function fixPos() {
		var listObject = new Array();
		for(var i = 0; i < relationTreeList.length; i++) {
			var tree = relationTreeList[i];
			listObject.splice(0, listObject.length);
			listObject.pushAll(tree._clusterList);
			////same
			// console.log("index: " + i + ", listObject.length: " + listObject.length);
			fixClusters(tree, listObject);
		}
	}
	function fixInv() {
		var listObject = new Array();
		for (var i = relationTreeList.length - 1; i >= 0; i--) {
			var tree = relationTreeList[i];
			listObject.splice(0, listObject.length);
			listObject.pushAll(tree._clusterList);
			fixClusters(tree, listObject);
		}
	}
	function fixClusters(tree, listObject) {
		for (var label = 0; label < listObject.length; label++) {
			var current = listObject[label];
			var top;
			if (label > 0) {
				top = listObject[label - 1];

				var floor = 0;
				//for previous
				if(top instanceof Session){
					floor = parseFloat(top.left_y + top.height+Property.SESSION_SPACE);
					if(current instanceof Session) {
						if(current.left_y < floor){
							current.left_y = floor;
						}
					}
					else if(current instanceof Cluster){
						for(var i = 0;i<current.ClusterSe.length; i++){
							var se = current.ClusterSe[i];
							if(se.overlap_se(top)){
								if((current.top + current.value_diff[i])<floor){
									current.top = floor-current.value_diff[i];
									putseInter(current);
								}
							}
						}
					}
				}
				else if(top instanceof Cluster){
					if(current instanceof Session){
						for(var i = 0; i < top.ClusterSe.length; i++) {
							var se = top.ClusterSe[i];
							if(se.overlap_se(current)){
								floor = Math.max(floor, se.left_y+se.height+Property.SESSION_SPACE);
							}
						}
						if(current.left_y < floor){
							current.left_y = floor;
						}
					}
					else if(current instanceof Cluster){
						floor = current.getTopSession(top);
						if(current.top < floor){
							current.top = floor;
							putseInter(current);
						}
					}
				}
			} else {	/////if(lable == 0)第一个的时候,设置初始值
				// top = null;
				if (current instanceof Session) {
					if (current.left_y > 20) {
					} else {
						current.left_y = 20;						
					}
				}
				else if(current instanceof Cluster){
					if (current.top > 20) {
					} else {
						current.top = 20;
						putseInter(current);
					}
				}
			}
		}
	}
	function putseInter(clu) { //根据Cluster的Top值，计算内部Session的坐标
		for (var mark = 0; mark < clu.ClusterSe.length; mark++) {
			var se = clu.ClusterSe[mark];
			se.left_y = clu.top + clu.value_diff[mark];
		}
	}
	/***********************************绘制部分*****************************/
	function drawTimeLine(svg){
		svg.selectAll("line")
				.data(relationTreeList)
			.enter()
			.append("line")
			.attr("stroke", "black")
			.attr("stroke-width",function(d,i){
				if(i%5==0)
					return 2;
				else return 1;
			})
			.attr("x1", function(d,i){
					return i*Property.TIMESTEP_WIDTH+Property.MARGIN_LEFT-Property.TIMESTEP_WIDTH/2;
			})
			.attr("y1", function(d,i){
				if(i%5)
					return Property.WINDOW_HEIGHT/2-38;
				else 
					return Property.WINDOW_HEIGHT/2-40;
			})
			.attr("x2", function (d,i){
				return i*Property.TIMESTEP_WIDTH+Property.MARGIN_LEFT-Property.TIMESTEP_WIDTH/2;
			})
			.attr("y2", Property.WINDOW_HEIGHT/2-25)
			.attr("opacity", function(d,i){
				if(i%5==0)
					return 0.5;
				else return 0.3;
			});

		svg.append("line")
			.attr("stroke", "black")
			.attr("stroke-width",3)
			.attr("x1", Property.MARGIN_LEFT-Property.TIMESTEP_WIDTH/2)
			.attr("y1", Property.WINDOW_HEIGHT/2-25)
			.attr("x2", 95*Property.TIMESTEP_WIDTH+Property.MARGIN_LEFT-Property.TIMESTEP_WIDTH/2)
			.attr("y2", Property.WINDOW_HEIGHT/2-25)
			.attr("opacity", 0.7);	

		svg.selectAll("text")
				.data(relationTreeList)
			.enter()
			.append("text")
			.attr("x", function(d,i){
				
				return (i-1)*Property.TIMESTEP_WIDTH+Property.MARGIN_LEFT-8;})
			.attr("y", Property.WINDOW_HEIGHT/2-8)
			.attr("font-size", "10px")
			.text(function(d, i){
				if(i%5==0)
				return "t"+i;
			});
	}
	/////////////画线
	function drawLines(svg) {
		for(var i = 0; i < MemberList.length; i++) {
			var member = MemberList[i];
			if(member.sessionTube.length == 0){
				continue;
			}
			//计算出每一个mem在每一个session中的坐标位置，结果放在coor_x和coor_y中
			//coor_x=new float[2*(sessionTube.size()-1)];
			//coor_y=new float[sessionTube.size()];
			member.computeCoor();
		}
//////////////////////////////////////////////////////////////
		//绘制一个角色代表的一条线
		svg.selectAll("path.memberline")
					.data(MemberList)
				.enter()
				.append("path")
				.attr("class", "memberline")
				.attr("d", function(d) { return get_line_path(d); })
				.attr("stroke", function (d) {return colors[d.id]; })
				.attr("stroke-width", Property.TUBE_WIDTH)
				.attr("fill", "none")
				.on("click", function(d, i) {
					d3.select(this).attr("stroke-width", function(d) {
						if(d3.select(this).attr("stroke-width") == Property.TUBE_WIDTH) {
							return 4;
						} else return Property.TUBE_WIDTH;
					});
//					console.log("id : " + d.id);
				});
///////////////////////////////////////////////////////////////
		// var line = d3.svg.line()
		// 				.x(function(d) { return d.x; })
		// 				.y(function(d) { return d.y; })
		// 				.interpolate("monotone");
	// 	var line = d3.svg.line()
	// 					.x(function(d) { return d.x; })
	// 					.y(function(d) { return d.y; })
	// 					.interpolate(function(d) {
	// 						var path, cx;
	// 						console.log(" d[0].x: " + d[0].x + "d[0].y: " + d[0].y);
	// 						path = "M" + d[0].x + "," + d[0].y;
	// 						for(var i = 0; i < d.length-1; i++) { 
	// 							if(d[i].y == d[i+1].y) {	//直线
	// 								path = path + "L" + d[i+1].x + "," + d[i+1].y; 
	// 							} else {	//曲线
	// 								cx = (d[i].x + d[i+1].x)/2;
	// 								path = path + "C" + cx + "," + d[i].y
	// 								        + " " + cx + "," + d[i+1].y
	// 								        + " " + d[i+1].x + "," + d[i+1].y;
	// 							}
	// 						}
	// 						return path;
	// 					});
	// 	svg.selectAll("path.curveline")
	// 			.data(MemberList)
	// 		.enter()
	// 		.append("path")
	// 		.attr("class", "curveline")
	// 		.attr("d", function(d) { return line(d.coordinate); })
	// 		.attr("stroke", function (d) {return colors(d.id); })
	// 		.attr("stroke-width", Property.TUBE_WIDTH)
	// 		.attr("fill", "none")
	// 		.on("click", function(d, i) {
	// 			d3.select(this).attr("stroke-width", function() {
	// 				if(d3.select(this).attr("stroke-width") == Property.TUBE_WIDTH)
	// 					return Property.TUBE_SELECT_WIDTH;
	// 				else return Property.TUBE_WIDTH;
	// 			});
	// 		});

	}
	//一个角色所代表的线的路径计算
	function get_line_path(member) {
		var x0, y0, x1, y1, x2, y2, cx1, cy1, cx2, cy2;
		var xlist = member.coor_x;
		var ylist = member.coor_y;
		var path;
		//前面是重复的line+curve,最后一个ylist.length-1只有直线
		for(var i = 0; i < ylist.length; i++) {
			//各个控制点计算			
			if( i < ylist.length - 1) {	//前面的画直线+曲线
				y1 = ylist[i];
				y2 = ylist[i+1];
//				x1 = xlist[2*i] - Property.BEZIER_K * Math.abs(y2-y1)/2;
//				x2 = xlist[2*i+1] + Property.BEZIER_K * Math.abs(y2-y1)/2;
				x1 = xlist[2*i];
				x2 = xlist[2*i+1];
				if(i == 0) {
//					x0 = x1 - 50;
					x0 = x1 - member.sessionTube[i].width;
					y0 = ylist[0];
					path = "M" + x0 + "," + y0;
				}
				
				cx1 = (x1 + x2)/2;
				cy1 = y1;
				cx2 = cx1;
				cy2 = y2;
				path = path + "L" + x1 + "," + y1
					        + "C" + cx1 + "," + cy1
					        + " " + cx2 + "," + cy2
					        + " " + x2 + "," + y2;
			} else {	//最后一个只画直线
				x1 = xlist[2*i-1] + member.sessionTube[i].width;
//				x1 = xlist[2*i-1] + 50;
				y1 = ylist[i];
				path = path + "L" + x1 + "," + y1; 
			}
		}
		return path;
	}
	/////////////画session背景括号
	function drawSessionLabel(svg) {
		/////////////////this place
		//左括号们
		// svg.selectAll("path.leftbrackets")
		// 		.data(SessionList)
		// 	.enter()
		// 	.append("path")
		// 	.attr("class", "leftbrackets")
		// 	.attr("d", function(d) { return get_lbrackets_path(d); })
		// 	// .attr("stroke", function (d) { return d3.rgb(0,0,0); })
		// 	.attr("stroke", function (d) { return get_lbrackets_color(d); })
		// 	.attr("stroke-width", Property.BRACKET_WIDTH)
		// 	.attr("fill", "none");
		// //右括号们
		// svg.selectAll("path.rightbrackets")
		// 		.data(SessionList)
		// 	.enter()
		// 	.append("path")
		// 	.attr("class", "rightbrackets")
		// 	.attr("d", function(d) { return get_rbrackets_path(d); })
		// 	// .attr("stroke", function (d) { return d3.rgb(0,0,0); })
		// 	.attr("stroke", function (d) { return get_rbrackets_color(d); })
		// 	.attr("stroke-width", Property.BRACKET_WIDTH)
		// 	.attr("fill", "none");
		///写来session.id瞅瞅
		svg.selectAll("text.session")
				.data(SessionList)
			.enter()
			.append("text")
			.attr("class", "session")
			.attr("x", function(d) { return d.left_x; })
			.attr("y", function(d) { return d.left_y + d.height + 3*Property.TUBE_WIDTH; })
			.style("font-size", "10px")
			// .text(function(d) { return d.id+"#"+d.location.id});
			.text(function(d) { return "ID:" + d.id});
	}
	//左括号，开始括号
	var left_M = [], right_M = [];
	function get_lbrackets_path(se) {
		//括号基本参数
		var left_top_x = se.left_x;
		var left_top_y = se.left_y - Property.BRACKET_MARGIN;
		var left_bottom_x = left_top_x;
		var left_bottom_y = se.left_y + se.height + Property.BRACKET_MARGIN;

		var left_seg = (se.start >= se.start_jh) ? (se.start - se.start_jh) : (se.start_jh - se.start);
		// var left_seg = se.start_jh - se.start;
		left_seg = left_seg * Property.TIMESTEP_WIDTH;

		//左括号起笔点
		left_M[se.id] = left_top_x + left_seg;
		//左半边括号绘制路径
		var path = "M" + (left_top_x + left_seg) + "," + left_top_y
					+ "L" + left_top_x + "," + left_top_y
					+ "L" + left_bottom_x + "," + left_bottom_y
					+ "L" + (left_bottom_x + left_seg) + "," + left_bottom_y;
		return path;
	}
	//右括号，结束括号
	function get_rbrackets_path(se) {
		//括号基本参数
		var righth_top_x = se.left_x + se.width;
		var righth_top_y = se.left_y - Property.BRACKET_MARGIN;
		var right_bottom_x = se.left_x + se.width;
		var right_bottom_y = se.left_y + se.height + Property.BRACKET_MARGIN;

		var right_seg = (se.end >= se.end_jh) ? (se.end - se.end_jh) : (se.end_jh - se.end);
		// var right_seg = se.end_jh - se.end;
		right_seg = right_seg * Property.TIMESTEP_WIDTH;
		
		//右括号起笔点
		right_M[se.id] = righth_top_x - right_seg;
		//如果左括号和有括号的绘制起点重叠，则错开
		if(right_M[se.id] <= left_M[se.id]) {
			righth_top_y = righth_top_y - Property.BRACKET_MARGIN;
			right_bottom_y = right_bottom_y + Property.BRACKET_MARGIN;
		}
		//右半边括号绘制路径
		var path = "M" + (righth_top_x - right_seg) + "," + righth_top_y
					+ "L" + righth_top_x + "," + righth_top_y
					+ "L" + right_bottom_x + "," + right_bottom_y
					+ "L" + (right_bottom_x - right_seg) + "," + right_bottom_y;
		return path;
	}
	//左括号颜色
	function get_lbrackets_color(se) {
		if(se.start > se.start_jh) return d3.rgb(255,0,0);	//晚开始
		else if(se.start == se.start_jh) return d3.rgb(255,255,0);	//时间刚好
		else if(se.start < se.start_jh) return d3.rgb(0,255,0);	//早开始
	}
	//右括号颜色
	function get_rbrackets_color(se) {
		if(se.end > se.end_jh) return d3.rgb(255,0,0);	//晚结束
		else if(se.end == se.end_jh) return d3.rgb(255,255,0);	//时间刚好
		else if(se.end < se.end_jh) return d3.rgb(0,255,0);	//早结束
	}
	///////////////绘制计划session
	function drawPlanSessionLabel(svg) {
		// svg.selectAll("rect")
		// 		.data(SessionList)
		// 	.enter()
		// 	.append("rect")
		// 	.attr("x", function(d) { return d.left_x_jh; })
		// 	.attr("y", function(d) { return d.left_y; })
		// 	.attr("width", function(d) { return d.width_jh; })
		// 	.attr("height", function(d) { return d.height; })
		// 	.attr("fill", d3.rgb(200,200,200))
		// 	.attr("opacity", 0.7);	//opacity:0-1
		svg.selectAll("rect")
				.data(SessionList)
			.enter()
			.append("rect")
			.attr("x", function(d) { return d.left_x-Property.TIMESTEP_WIDTH/2; })
			.attr("y", function(d) { return d.left_y; })
			.attr("width", function(d) { return d.width+Property.TIMESTEP_WIDTH/3*2; })
			.attr("height", function(d) { return d.height; })
			.attr("fill", d3.rgb(200,200,200))
			.attr("opacity", 0.5);	//opacity:0-1
	}
	///////画前面的names
	function drawLineLable(svg) {
		/////写来session.id瞅瞅
		svg.selectAll("text.member")
				.data(MemberList)
			.enter()
			.append("text")
			.attr("class", "member")
			.attr("x", function(d) { return d.coor_x[0]-d.sessionTube[0].width-13; })
			.attr("y", function(d) { return d.coor_y[0] + 4; })
			.attr("stroke", function (d) {return colors[d.id]; })
			.style("font-size", "8px")
			.text(function(d) { return d.id});
	}
	/////
	//执行该函数
	render();
}
LocationLayout();