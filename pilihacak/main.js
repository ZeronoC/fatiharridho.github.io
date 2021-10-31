function S_Alert(text,body){
    Swal.fire({
        title: `<strong>${text}</strong>`,
        icon: 'info',
        html:`<strong>${body}</strong>`,
        confirmButtonColor: '#1266f1',
        confirmButtonText:
          '<i class="fa fa-thumbs-up"></i> Ok',
      })
}

function F_Alert(text){
    Swal.fire({
        icon: 'error',
        title: 'Waduw',
        text: text,
    })
}

function SetUpPie(data){
    var padding = {top:20, right:40, bottom:0, left:0},
        w = 300 - padding.left - padding.right,
        h = 300 - padding.top  - padding.bottom,
        r = Math.min(w, h)/2,
        rotation    = 0,
        oldrotation = 0,
        picked      = 0,
        oldpick     = [],
        color       = d3.scale.category20b();        
    //reset 
    document.getElementById('chart').innerHTML='';

    var svg = d3.select('#chart')
        .append("svg")
        .data([data])
        .attr("style",  'background:#e2e2e2;border-radius:20px;padding-left:5px;')
        .attr("width",  w + padding.left + padding.right)
        .attr("height", h + padding.top + padding.bottom);
    var container = svg.append("g")
        .attr("class", "chartholder")
        .attr("transform", "translate(" + (w/2 + padding.left) + "," + (h/2 + padding.top) + ")");
    var vis = container
        .append("g");
        
    var pie = d3.layout.pie().sort(null).value(function(d){return 1;});
    // declare an arc generator function
    var arc = d3.svg.arc().outerRadius(r);
    // select paths, use arc generator to draw
    var arcs = vis.selectAll("g.slice")
        .data(pie)
        .enter()
        .append("g")
        .attr("class", "slice");
        
    arcs.append("path")
        .attr("fill", function(d, i){ return color(i); })
        .attr("d", function (d) { return arc(d); });
    // add the text
    arcs.append("text").attr("transform", function(d){
            d.innerRadius = 0;
            d.outerRadius = r;
            d.angle = (d.startAngle + d.endAngle)/2;
            return "rotate(" + (d.angle * 180 / Math.PI - 90) + ")translate(" + (d.outerRadius -10) +")";
        })
        .attr("fill", "white")
        .attr("text-anchor", "end")
        .text( function(d, i) {
            return data[i].length > 7?data[i].substr(0,7)+'..' :data[i];
        });
    container.on("click", spin);
    function spin(d){
        if(data.length <2){
           return F_Alert('Isi data dulu, Minimal 2 Data !');
        }
        container.on("click", null);
        //all slices have been seen, all done
        
        if(oldpick.length == data.length){
            container.on("click", F_Alert('Sudah Habis!'));
            return;
        }
        var  ps = 360/data.length,
            rng = Math.floor((Math.random() * 1440) + 360);
            
        rotation = (Math.round(rng / ps) * ps);
        
        picked = Math.round(data.length - (rotation % 360)/ps);
        picked = picked >= data.length ? (picked % data.length) : picked;
        if(oldpick.indexOf(picked) !== -1){
            d3.select(this).call(spin);
            return;
        } else {
            oldpick.push(picked);
        }
        rotation += 90 - Math.round(ps/2);
        vis.transition()
            .duration(3000)
            .attrTween("transform", rotTween)
            .each("end", function(){
                //mark seleced
                d3.select(".slice:nth-child(" + (picked + 1) + ") path")
                    .attr("fill", "#111");
                //change color
                d3.select(".slice:nth-child(" + (picked + 1) + ") text")
                    .attr("fill", "#706c6c");
                //show result
                d3.select("#win span")
                    .text(data[picked]);
                oldrotation = rotation;
                S_Alert(data[picked],'Selamat, Kamu terpilih !');
                
            
                /* Comment the below line for restrict spin to sngle time */
                container.on("click", spin);
            });
    }
    //make arrow
    svg.append("g")
        .attr("transform", "translate(" + (w + padding.left + padding.right) + "," + ((h/2)+padding.top) + ")")
        .append("path")
        .attr("d", "M-" + (r*.13) + ",0L0," + (r*.05) + "L0,-" + (r*.05) + "Z")
        .style({"fill":"black"});
    //draw spin circle
    container.append("circle")
        .attr("cx", 0)
        .attr("cy", 0)
        .attr("r", 40)
        .style({"fill":"white","cursor":"pointer"});
    //spin text
    container.append("text")
        .attr("x", 0)
        .attr("y", 10)
        .attr("text-anchor", "middle")
        .text("START")
        .style({"font-weight":"bold", "font-size":"20px"});


    function rotTween(to) {
        var i = d3.interpolate(oldrotation % 360, rotation);
        return function(t) {
            return "rotate(" + i(t) + ")";
        };
    }
}

//init
var list_data =GetFromDB();
const list_element = document.getElementById('list');
RenderList();

if(list_data.length <2){
    S_Alert('Isi data dulu ya kak!','Minimal 2 deh.');
}else{
    SetUpPie(list_data);
}


function list_template(val,i){ return`
    <div class="d-flex p-2" data_index="${i}">
        <input type="text" class="form-control" value="${val}">
        <button onclick="UpdateData(${i})" type="button" class="btn btn-warning btn-floating mx-1">
            <i class="fas fa-edit"></i>
        </button>
        <button onclick="DeleteData(${i})" type="button" class="btn btn-danger btn-floating mx-1">
            <i class="fas fa-trash"></i>
        </button>
    </div>
`};

function RenderList(){
    list_element.innerHTML=`${list_data.map((v,i)=>list_template(v,i)).join('')}`;
}


function UpdateData(i) {
    let val = document.querySelector(`#list > div:nth-child(${i+1}) > input`).value.trim();
    if(val == ''){
        return F_Alert('Wajid Diisi !');
    }
    list_data[i]= val;
    RenderList();
    StoreToDB(list_data);
    SetUpPie(list_data);
}

function CheckIndex(arr,val){
    let index = arr.findIndex(element => {
        return element.toLowerCase() === val.toLowerCase();
    });
    return index;
}

function AddData(e) {
    e.preventDefault();
    let el  = document.getElementById(`input_data`);
    let val = el.value.trim();
    
    if(val == ''){
        return F_Alert('Wajid Diisi !');
    }
    

    if(CheckIndex(list_data,val) >= 0){
        return F_Alert(`Sudah ada data "${val}"!`);
    }
    el.value='';
    list_data.push(val);
    RenderList();
    StoreToDB(list_data);
    SetUpPie(list_data);

}

function DeleteData(i) {
    list_data.splice(i, 1);
    RenderList();
    StoreToDB(list_data);
    SetUpPie(list_data);
}

function StoreToDB(data){
    localStorage.setItem('list_data',JSON.stringify(data));
}
function GetFromDB(){
    return JSON.parse(localStorage.getItem('list_data')) || [];
}        