var width =  1357, // w & h of graph area
    height = 811,
    margins =  [1, 1, 42, 42], // top, rifght, bottom, left
    paddings = [100,100, 100,100]; // top, rifght, bottom, left

var filters = { 
  level: [
    {name:'I', value:'I'},
    {name:'II', value:'II'},
    {name:'III', value:'III'},
    {name:'IV', value:'IV'},
    {name:'V', value:'V'},
    {name:'VI', value:'VI'},
    {name:'VII', value:'VII'},
    {name:'VIII', value:'VIII'},
    {name:'IX', value:'IX'},
    {name:'X', value:'X'}],
  country: [
    {name:'ussr', value:'СССР'},
    {name:'germany', value:'ГЕР'},
    {name:'us', value:'США'},
    {name:'gb', value:'БРИТ'}],
  weight: [
    {name:'light', value:'Лёгкие'},
    {name:'middle', value:'Средние'},
    {name:'heavy', value:'Тяжёлые'},
    {name:'spg', value:'ПТ-САУ'}]
}

var tanks_svg_scale = 0.6;
var tanks_svg_offset = [-280, -250].map( function(d) { return d * tanks_svg_scale; });

function get_details_text(d){
  var html = 
    '<h2>'+d.model+'</h2>'+
    '<table>'+
      '<tr>'+
        '<td>Скорость, км/ч</td>'+
        '<td>'+d.velocity+'</td>'+
        '<td></td>'+
      '</tr>'+
      '<tr>'+
        '<td>Урон за 10 сек., у.е.</td>'+
        '<td>'+d.damage+'</td>'+
        '<td></td>'+
      '</tr>'+
      '<tr>'+
        '<td>Прочность, у.е.</td>'+
        '<td>'+d.hit_points+'</td>'+
        '<td></td>'+
      '</tr>'+
      '<tr>'+
        '<td colspan=3><b>Броня, у.е.</b></td>'+
      '</tr>'+
      '<tr>'+
        '<td>Лоб</td>'+
        '<td>'+d.armor[0]+'</td>'+
        '<td></td>'+
      '</tr>'+
      '<tr>'+
        '<td>Борт</td>'+
        '<td>'+d.armor[2]+'</td>'+
        '<td></td>'+
      '</tr>'+
      '<tr>'+
        '<td>Корма</td>'+
        '<td>'+d.armor[1]+'</td>'+
        '<td></td>'+
      '</tr>'+
      '<tr>'+
        '<td>Лоб башни</td>'+
        '<td>'+d.armor[3]+'</td>'+
        '<td></td>'+
      '</tr>'+
      '<tr>'+
        '<td>Борт башни</td>'+
        '<td>'+d.armor[5]+'</td>'+
        '<td></td>'+
      '</tr>'+
      '<tr>'+
        '<td>Корма башни</td>'+
        '<td>'+d.armor[4]+'</td>'+
        '<td></td>'+
      '</tr>'+
    '</table>'+
    '<div class="image-placeholder"></div>'
  return html;
}

d3.selection.prototype.moveToFront = function() {
  return this.each(function(){
    this.parentNode.appendChild(this);
  });
};

function uncollapse_extent(extent){
  if (extent[0] != extent[1]){
    return extent;
  }
  else{
    return [extent[0]-100, extent[0]+100];
  }
}

$(document).ready(function() {
  d3.csv("data.csv", function(error, csv) {
    if (error) return console.warn(error);
    d3.xml("img/svg/universal.svg", "image/svg+xml", function(xml) {
      var tanks_svg = document.importNode(xml.documentElement, true);

      csv = csv.map( function(d) {
        delete d.armorhf;
        delete d.armorhr;
        delete d.armorhs;
        delete d.armortf;
        delete d.armortr;
        delete d.armorts;
        d.armor = d.armor.split('/');
        d.damage = +d.damage;
        return d;
      } )
      var data = csv;

      var scale_velocity, scale_damage, scale_armor;
      var armor_values = [];
      for (var i = data.length - 1; i >= 0; i--){
        for (var key in data[i].armor) {
          armor_values.push(data[i].armor[key]);
        }
      }
      var scale_armor_extent = d3.extent(armor_values);
      scale_armor = d3.scale.linear()
        //TODO rewrite
        .domain([scale_armor_extent[0], scale_armor_extent[0]/2+scale_armor_extent[1]/2, scale_armor_extent[1]])
        .range(['orange', 'gold', 'yellowgreen']);
      var xAxis = d3.svg.axis()
        //.scale(scale_velocity)
        .orient("bottom"),
        yAxis = d3.svg.axis()
          //.scale(scale_damage)
          .orient("left");

      //// color legend
      //var colors = d3.scale.quantize()
      //.range(['red', 'white', 'blue', 'green', 'black', 'yellow', 'pink']);
      //var legend = d3.select('#legend')
      //.append('ul')
      //.attr('class', 'list-inline');
      //var keys = legend.selectAll('li.key')
      //.data(colors.range());
      //keys.enter().append('li')
      //.attr('class', 'key')
      //.style('border-top-color', String)
      //.text(function(d) {
      //var r = colors.invertExtent(d);
      //return formats.percent(r[0]);
      //});

      var svg = d3.select("body").append("svg")
        .attr("width", width + margins[1] + margins[3])
        .attr("height", height + margins[0] + margins[2])
        .classed('scatterplot', true)
        .append('g')
        .attr('transform', 'translate('+margins[3]+','+margins[0]+')');

      svg.append('rect')
      .attr('id', 'graph-border')
      .attr({
        width: width,
        height: height
      });

      var details = d3.select('body').append('div')
        .attr('class', 'details');

      //var details = svg.append('foreignObject')
        //.attr({
          //width: "200", height: "200", requiredFeatures: "http://www.w3.org/TR/SVG11/feature#Extensibility"
        //})
        //.append('p')
        //.attr({
          //xmlns: "http://www.w3.org/1999/xhtml"
        //})
        //.text('Text goes here');
        //.attr({
          //class: "node", x: "46", y: "22", width: "200", height: "300",
        //})
        //.append('body').attr('xmlns', 'http://www.w3.org/1999/xhtml')
        //.append('div').attr('id','info')
        //.text('hello!!!');

      // Перенесём все элементы inkscape файла в созданный нами svg
      //TODO сейчас элементы переезжают в svg не оптимальным способом
      d3.select('body').each(function(d, i){ 
        var plane = this.appendChild(tanks_svg.cloneNode(true)); 
      });
      // на старый svg добавляем классы для всех танков, включая default
      // TODO переписать на d3
      $('svg:nth-of-type(2)>g').attr('class','tank');
      //$('svg:nth-of-type(2)>g').wrapInner('<g class="tank-svg"></g>');
      // переносим их на новый svg)
      // .tanks - обёртка для всех танков на графике
      svg.append('defs').classed('tanks', true);
      $('svg:nth-of-type(2)>g').detach().appendTo($('svg.scatterplot .tanks'));
      $('svg:nth-of-type(2)').detach();
      d3.selectAll('g.tank').each( function(d,i) {
        // собираемся прикрепить данные по названию модели, поэтому пропишем его в дате
        // TODO переписать через d3 функцию .datum()
        this.__data__ = {model: d3.select(this).attr(':inkscape:label')}
        d3.select(this).attr('transform',
                            'translate('+tanks_svg_offset[0]+','+tanks_svg_offset[1]+') '+
                            'scale('+tanks_svg_scale+')');
      } );
      
      // Добавляем флажки и прочее в наши .tanks
      var tanks = svg.select('.tanks').selectAll('g.tank')
        .data(data, function(d){return d.model;});
      var tank_extra = tanks.append('g')
        .classed('extra', true);
      tank_extra
        .append("svg:image")
        .attr('width', '20')
        .attr('height', '12')
        .attr("xlink:href", function(d) {
          return "img/icons-flag/"+d.country+".png";
        });
      tank_extra
        .append("text")
        .text( function(d) {
          return d.model;
        } );
      tanks
        .each(function(d, i){ 
          //var plane = this.appendChild(d3.select("[:inkscape:label='default']").cloneNode(true)); 
          d3.select(this).select("[id^='tf']").attr("fill", scale_armor(d.armor[0])).attr('style', '');
          d3.select(this).select("[id^='tr']").attr("fill", scale_armor(d.armor[1])).attr('style', '');
          d3.select(this).select("[id^='ts']").attr("fill", scale_armor(d.armor[2])).attr('style', '');
          d3.select(this).select("[id^='hf']").attr("fill", scale_armor(d.armor[3])).attr('style', '');
          d3.select(this).select("[id^='hr']").attr("fill", scale_armor(d.armor[4])).attr('style', '');
          d3.select(this).select("[id^='hs']").attr("fill", scale_armor(d.armor[5])).attr('style', '');
        });
      tanks
        .enter()
        .append('use')
        .classed('tank', true)
        //.attr('width',40)
        //.attr('height',40)
        .attr('xlink:href', '#default')

      svg.append("g")
        .attr("class", "y axis");
      svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")");

      function get_id_by_model(model){
        var id = 'default';
        d3.selectAll('.tanks>g').each( function(d) {
          //console.log('? '+d3.select(this).attr(':inkscape:label')+" =  "+model);
          if(d3.select(this).attr(':inkscape:label') == model){
            id = d3.select(this).attr('id');
          }
        });
        //console.log('no model named '+model);
        return id;
      }

      function update_scale(){
        var extent_velocity = d3.extent(data, function(d) { return d.velocity; });
        var extent_damage   = d3.extent(data, function(d) { return d.damage; });
        scale_velocity = d3.scale.linear()
          .domain(uncollapse_extent(extent_velocity))
          .range([paddings[3], width - paddings[1]]),
        scale_damage = d3.scale.linear()
          .domain(uncollapse_extent(extent_damage))
          .range([height - paddings[2], paddings[0]]);
        //console.log(d3.extent(data, function(d) { return d.damage; }));

        var xAxis_scale = xAxis.scale(scale_velocity);
        var yAxis_scale = yAxis.scale(scale_damage);

        svg.select("g.y.axis")
          .transition().duration(500)
          .call(yAxis);
        svg.select("g.x.axis")
          .transition().duration(500)
          .call(xAxis);
      }

      function update_scatterplot(){
        var tanks_ = svg.selectAll('use.tank')
          .data(data);
          //.data(data, function(d){return d.model;});
        // enter
        tanks_
          .enter()
          .append('use')
          .classed('tank', true)
          //.attr('width',40)
          //.attr('height',40)
          // TODO
          .attr('xlink:href', function(d) {
            return '#'+get_id_by_model(d.model);
          })
          .on("mouseover",function(d){
            var sel = d3.select(this);
            sel.moveToFront();
            console.log('over...... x=', sel);
            details
              .classed('left', d3.select(this).attr('x') < 500)
              .html(get_details_text(d))
              .transition()
              .style({opacity: 1})
              .style({display: 'block'});
          })
          .on("mouseout", function(d) {
            console.log('out')
            // TODO enable
            //details
              //.transition()
              //.style({opacity: 0})
              //.style({display: 'none'});
          });
          //.attr('opacity', 0)
          //.transition()
          //.attr('opacity', 1);
        // update
        tanks_
          //.transition()
          //.attr('transform', function(d){ 
            //var x = scale_velocity(d.velocity) + tanks_svg_offset[0];
            //var y = scale_damage(d.damage) + tanks_svg_offset[1];
            //return 'translate('+x+','+y+')';
          //});
          .attr('x', function(d){ 
            return scale_velocity(d.velocity);
          })
          .attr('y', function(d){ 
            return scale_damage(d.damage);
          });
        // exit
        tanks_
          .exit()
          //.transition()
          .attr('opacity', 0)
          .remove();
        tanks_.sort( function(a,b) {
          if (a.damage > b.damage)
            return -1;
          return 1;
        } );
      }

      function update_data() {
        var current_filters = {
          level: $.map( $("#buttonset-level :checked"), function(val){
            return val.name;
          }),
          country:  $.map( $("#buttonset-country :checked"), function(val){
            return val.name;
          }),
          weight:  $.map( $("#buttonset-weight :checked"), function(val){
            return val.name;
          })
        };
        data = csv.filter( function(d) {
          if (current_filters.level.indexOf(d.level) >= 0 &&
            current_filters.country.indexOf(d.country) >= 0 &&
            current_filters.weight.indexOf(d.weight) >=0) {
              return true;
            }
          return false;
        });
        //console.log(data);
      }

      function init_document(){
        for(i in filters.country) {
          var nam = filters.country[i].name;
          var val = filters.country[i].value;
          $('<input type="checkbox"  id="checkbox-country-'+nam+'" name="'+nam+'"><label for="checkbox-country-'+nam+'"><img src="img/icons-flag/'+nam+'.png" class="flag"></span>'+val+'</label>', {
          }).appendTo('#buttonset-country');
        }
        for(i in filters.weight) {
          var nam = filters.weight[i].name;
          var val = filters.weight[i].value;
          $('<input type="checkbox" id="checkbox-weight-'+nam+'" name="'+nam+'"><label for="checkbox-weight-'+nam+'">'+val+'</label>', {
          }).appendTo('#buttonset-weight');
        }
        for(i in filters.level) {
          var nam = filters.level[i].name;
          var val = filters.level[i].value;
          $('<input type="checkbox" id="checkbox-level-'+nam+
              '" name="'+nam+
              '"><label for="checkbox-level-'+nam+
              '">'+val+
              '</label>', {
          }).appendTo('#buttonset-level');
        }
        $('#checkbox-country-ussr')[0].checked = true;
        $('#checkbox-country-germany')[0].checked = true;
        $('#checkbox-weight-middle')[0].checked = true;
        $('#checkbox-level-IV')[0].checked = true;
        $('.buttonset').buttonset();
        $('.buttonset').click(function(evt) {
          update_data();
          update_scale();
          update_scatterplot();
        });
        $('.buttonset').trigger( "click" );
      }

      init_document();
    });
  });
});
