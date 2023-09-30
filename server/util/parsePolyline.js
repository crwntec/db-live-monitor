export default function parsePolyline(polyline) {
    let polylinePoints = []
    let stops = []
  
    polyline.features.forEach(element => {
        if (element.properties.type == 'stop') {
            stops.push(element)
        } else {
            polylinePoints.push([element.geometry.coordinates[1],element.geometry.coordinates[0]])
        }
    });
    return [polylinePoints, stops]
  }
  