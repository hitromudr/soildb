
ymaps.ready(init);
var myPlacemark; 
var myMap;
var myCollection;
var storedData = {};
	
function init() {
	var coords = [47.55, 38.7]; 
	   
	myMap = new ymaps.Map('myMap', {
	center: [47.55, 38.7],
	  zoom: 12
	//     ,            behaviors: ['ruler', 'scrollZoom']
	});

	myPlacemark = createPlacemark(coords);
	myMap.geoObjects.add(myPlacemark);
	// Слушаем событие окончания перетаскивания на метке.
	myPlacemark.events.add('dragend', function() {
		coords = myPlacemark.geometry.getCoordinates();
		Latitude.value = coords[0].toPrecision(6);
		Longitude.value = coords[1].toPrecision(6);
	}); 

	myMap.events.add('click', function(e) {
	  var coords = e.get('coords');
	  Latitude.value = coords[0].toPrecision(6);
	  Longitude.value = coords[1].toPrecision(6);
	  // Если метка уже создана – просто передвигаем ее.
	  if (myPlacemark) myPlacemark.geometry.setCoordinates(coords);
	});
	//       myMap.behaviors.enable('drag');
	myMap.setType('yandex#hybrid');
	//       myMap.controls.add(new ymaps.control.TypeSelector());        
	myCollection = new ymaps.GeoObjectCollection({}, { preset: 'islands#redIcon' });
}

function createPlacemark(coords) {
	return new ymaps.Placemark(coords, {
		iconCaption: 'можно тащить'
	}, {
		preset: 'islands#violetDotIconWithCaption',
		draggable: true
	});
}

function load_RSS() {
	var title;
	var doc_root;
	var doc_channel;
	var polygon_node;
	var soil_node;
	var sHTML = 'нет объектов в зоне выбора';
	var t_string;
	var url = "https://gis.soil.msu.ru/soil_db/fertilizers/GEORSSHandler_Field.ashx?Latitude=";
	//var url = " http://db.soil.msu.ru/fertilizers/GEORSSHandler_Field.ashx?Latitude=";
	var refer = url + Latitude.value + "&longitude=" + Longitude.value; //'test_TM.xml';  //
	var xhr = new XMLHttpRequest();
	xhr.open('GET', refer); // + '&r=' + Math.random()
	xhr.setRequestHeader('Content-Type', 'text/xml; charset=utf-8'); //header('Content-Type: text/plain; charset=windows-1251');
	xhr.onload = function (e) {
		if (xhr.status != 200) {
			alert('Ошибка ' + xhr.status + ': ' + xhr.statusText);
		} else {
			//     if (!(xhr.responseXML.documentElement == null)) {
			doc_root = xhr.responseXML;
	 ///// parse and display Description
			if (doc_root.getElementsByTagName('item').length >0) {
				var doc_item;
				if (doc_root.getElementsByTagName('Полигоны_агрохимического_обследования').length > 0) {
					doc_item = doc_root.getElementsByTagName('Полигоны_агрохимического_обследования')[0];
					t_string = '<table border="1" align="center">';
					for (var i = 0; i < doc_item.childNodes[0].childNodes.length; i++) {
						t_string = t_string + '<tr><td>' + doc_item.childNodes[0].childNodes[i].nodeName + '</td><td>' +
						doc_item.childNodes[0].childNodes[i].childNodes[0].nodeValue + '</td></tr>';
						if (doc_item.childNodes[0].childNodes[i].nodeName == 'Район') iDistrict.value = doc_item.childNodes[0].childNodes[i].childNodes[0].nodeValue;
						if (doc_item.childNodes[0].childNodes[i].nodeName == 'Фосфор') iP.value = doc_item.childNodes[0].childNodes[i].childNodes[0].nodeValue;
						if (doc_item.childNodes[0].childNodes[i].nodeName == 'Калий') iK.value = doc_item.childNodes[0].childNodes[i].childNodes[0].nodeValue;           
					}
					t_string = t_string + '</table>';
					calculate();
				}
				document.getElementById('for_test').innerHTML = t_string;

				  //// parse Geography
				  polygon_node = doc_root.getElementsByTagName('item')[0].childNodes[4].childNodes[0].childNodes[0].childNodes[0].childNodes[0];
				if (polygon_node.xml) {
					t_string = polygon_node.nodeValue //.xml             // Converts the xml object to string  (  For IE)
				} else {
					t_string = new XMLSerializer().serializeToString(polygon_node);      // Converts the xml object to string (For rest browsers, mozilla, etc)
				}
				var arr_a = t_string.split('>')[1];
				var arr_c = arr_a.split('<')[0];
				arr_a = arr_c.split(' ');
				var t;
				var arr_b = [['1', '2'], ['3', '4']];
				for (var i = 0; i < arr_a.length / 2; i++) {
					t = arr_a[i * 2] + ',' + arr_a[i * 2 + 1];
					arr_b[i] = t.split(',');
				}
				var myPolygon1 = new ymaps.GeoObject({ geometry: { type: "Polygon", coordinates: [arr_b] },
					properties: { hintContent: "Многоугольник" }
				},
				{ interactivityModel: 'default#transparent', fillColor: '#7df9ff33', opacity: 0.5, strokeColor: '#FF0000',
				  // Прозрачность обводки.
				  strokeOpacity: 0.5, strokeWidth: 2
				});
				myCollection.add(myPolygon1);
				myMap.geoObjects.add(myCollection);
				/// end Geography
			} //// end Description
				  
				///  else document.getElementById('details').src = refer;        

		} // doc xhr
	};
	xhr.send();
}
   
var scoeff = '1.4|1.3|1|0.7|0.3|0.2|1.2|1.1|1|0.5|0.2|0.2|1.5|1.2|1|0.7|0.5|0.3|1.3|1.1|1|0.5|0.3|0.2|1|1|1|0.3|0|0|1.5|1.3|1|0.7|0.5|0.3|';

var aN_Id;
var aN_crop_id;
var aN_Crop;
var aN_Nutrition_element;
var aN_Zone ;
var aN_Norma;
var aZone;
var aZone_id;
var aId;
var aclass;
var aclass_name;
var anutrition;
var acontent_min;
var acontent_max;
var acrop_group;
var acoeff_min;
var acoeff_max;

function calculate() {
	var cropSelect = document.getElementById("crop_select");
	iCrop_group.value = aCrop_Groups_id[cropSelect.options[cropSelect.selectedIndex].value];		
	iZone_Kod.value=0;
	iZone.value='Область';
	for (var i = 0; i < aDistrict.length - 1; i++)
	if (iDistrict.value == aDistrict[i]) { 
		iZone_Kod.value = aZone_id[i];
		iZone.value = aZone[i]; 
	}
	iPk.value = 'не определено'; 
	iKk.value = 'не определено';
	iK_P.value=0;
	iK_K.value=0;
	for (var i = 0; i < aId.length - 1; i++) {
		if ((anutrition[i] == 'Фосфорные удобрения') && (iP.value > acontent_min[i]) && (iP.value <= acontent_max[i]) && (acrop_group[i] == iCrop_group.value))
		{ iPk.value = aclass_name[i]; iK_P.value = acoeff[i]; }
		if ((anutrition[i] == 'Калийные удобрения') && (iK.value > acontent_min[i]) && (iK.value <= acontent_max[i]) && (acrop_group[i] == iCrop_group.value))
		{ iKk.value = aclass_name[i]; iK_K.value = acoeff[i]; }
	}
	iHN.value=0;iHP.value=0;iHK.value=0;
	for (var i = 0; i < aN_Id.length - 1; i++) {
		if ((iZone_Kod.value == aN_Zone[i]) && (aN_Nutrition_element[i] == 'N') && (aN_crop_id[i] == cropSelect.options[cropSelect.selectedIndex].value))
			iHN.value = aN_Norma[i];
		if ((iZone_Kod.value == aN_Zone[i]) && (aN_Nutrition_element[i] == 'P_2_O_5') && (aN_crop_id[i] == cropSelect.options[cropSelect.selectedIndex].value))
			iHP.value = aN_Norma[i];
		if ((iZone_Kod.value == aN_Zone[i]) && (aN_Nutrition_element[i] == 'K_2_O') && (aN_crop_id[i] == cropSelect.options[cropSelect.selectedIndex].value))
			iHK.value = aN_Norma[i];
	}
	
	var Ur = document.getElementById("Ur");
	iDn.value = iHN.value * parseInt(Ur.options[Ur.selectedIndex].value) * 10;
	iDp.value = iHP.value * parseInt(Ur.options[Ur.selectedIndex].value) * 10 * iK_P.value;
	iDk.value = iHK.value * parseInt(Ur.options[Ur.selectedIndex].value) * 10 * iK_K.value; 
}   

(function ($, Drupal, data, document) {

  'use strict';

  // To understand behaviors, see https://drupal.org/node/756722#behaviors
  Drupal.behaviors.my_custom_behavior = {
    attach: function (context, settings) {

      // Place your code here.
      loadParameters();
    }
  };

})(jQuery, Drupal, this, this.document);

/**
 * Загрузить XML-документ с описанями.
 */
function loadParameters() {

	var url = 'http://db.soil.msu.ru/fertilizers/GEORSSHandler_Fertilizers_parameters.ashx?method=Get_Start_Parameters';

	$.ajax({
		type: 'get',
		dataType: 'xml',
		url: url,
		success: parseParameters
	});
}

/**
 * Разобрать XML-документ в массивы.
 */
function parseParameters(xml) {

	// Параметры.
	var xmlParameters = getXMLParameters();
	// Пройтись по разделам параметров.
	for (var section in xmlParameters) {

		// Это не раздел.
		if ( ! xmlParameters.hasOwnProperty(section)) {
			continue;
		}

		// Найти в XML разделы по имени тега и перебрать их.
		$(xml).find(section).each(function(key, val) {
			
			// Пройтись по параметрам раздела.
			for (var i = 0; i < xmlParameters[section].length; i++) {

				// Имя и значение параметра.
				var parameterName = section + '_' + xmlParameters[section][i],
					parameterValue = $(val).find(xmlParameters[section][i]).text();
				
				if ( ! storedData[parameterName]) {
					storedData[parameterName] = [];
				}
				// Добавить значение в массив параметра.
				storedData[parameterName].push(parameterValue);
			}
		});
	}
	
	for (var i=0; i < storedData.crops_Id.length - 1; i++) {
		var oOption = document.createElement("OPTION");
		oOption.text = storedData.crops_Crop_Name[i];
		oOption.value = storedData.crops_Id[i];
		document.getElementById("crop_select").options.add(oOption);
	}

	document.getElementById("crop_select").selectedIndex = 0;
	
	initialize();
}

/**
 * Загрузить список разделов и параметров XML-документа.
 */
function getXMLParameters() {

	return {
		crops: [
			'Id',
			'Crop_Name',
			'Crop_group'
		],

		Normatives: [
			'Id',
			'crop_id',
			'Crop',
			'Nutrition_element',
			'Zone',
			'Norma'
		],

		class_coefficients: [
			'Id',
			'class',
			'class_name',
			'nutrition',
			'content_min',
			'content_max',
			'crop_group',
			'coeff_min',
			'coeff_max'
		],

		districts: [
			'Природно_x0020_экономические_x0020_зоны_x0020_Ростовский_x0020_области',
			'район',
			'код'
		],
	};
}

function initialize() {
	aId = storedData.class_coefficients_Id;
	aclass = storedData.class_coefficients_class;
	aclass_name = storedData.class_coefficients_class_name;
	anutrition = storedData.class_coefficients_nutrition;
	acontent_min = storedData.class_coefficients_content_min;
	acontent_max = storedData.class_coefficients_content_max;
	acrop_group = storedData.class_coefficients_crop_group;
	acoeff = scoeff.split("|");   
	
	aN_Id = storedData.Normatives_Id;
	aN_crop_id = storedData.Normatives_crop_id;
	aN_Crop = storedData.Normatives_Crop;
	aN_Nutrition_element = storedData.Normatives_Nutrition_element;
	aN_Zone = storedData.Normatives_Zone;
	aN_Norma = storedData.Normatives_Norma;

	aZone = storedData['districts_Природно_x0020_экономические_x0020_зоны_x0020_Ростовский_x0020_области'];
	aZone_id = storedData['districts_код']; 
    aDistrict = storedData['districts_район'];
      
	aCrop_Groups_id=storedData.crops_Crop_group;
	aCrop_Names=storedData.crops_Crop_Name;
	aCrops_id=storedData.crops_Id;  
	
	console.log(storedData);
	for (var i=0;i<aCrops_id.length-1;i++) {
		var oOption = document.createElement("OPTION");
		oOption.text=aCrop_Names[i];
		oOption.value=aCrops_id[i];
		document.getElementById("crop_select").options.add(oOption);
	}
	document.getElementById("crop_select").selectedIndex = 0;	
}
