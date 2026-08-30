let angle = 60, angle2 = 50;
let baseR = 200;
let r;

let canvas;

let rotationAngle = 0;
let rotationSpeed = 0.02;

function setup() {
  const size = getCanvasSize();
  canvas = createCanvas(size.width, size.height, WEBGL);
  canvas.parent('mirror-canvas');

  r = baseR * (size.width / 1200);

  strokeWeight(0.9);
  stroke("#F3EEE6");

  angleMode(DEGREES);
  colorMode(HSB);

  noFill();
}

function windowResized() {
  const size = getCanvasSize();
  resizeCanvas(size.width, size.height);
  r = baseR * (size.width / 1200);
}

function getCanvasSize() {
  const container = document.getElementById('mirror-canvas');
  const width = Math.min(container.offsetWidth, 640);
  const height = width * (1850 / 1200);
  return { width, height };
}

function draw() {
  clear();

  rotateY(rotationAngle);
  rotateX(rotationAngle);
  rotateZ(rotationAngle);
  rotationAngle += rotationSpeed;

  happySphere(1);
  sadSphere(0);
}

function happySphere(happy){
  let freq = 10*sin(angle);
  let freq2 = 10*sin(angle2);

  beginShape();
  for(let theta = 0; theta < 360; theta += 0.5){
    let x = r * cos(theta*freq*happy)*2;
    let y = r * sin(theta*freq*happy) * sin(theta*freq2*happy)*2;
    let z = r * sin(theta*freq*happy) * cos(theta*freq2)*2;
    vertex(x, y, z);
  }
  endShape();

  angle += 0.01;
  angle2 += 0.01;
}

function sadSphere(sad){
  beginShape(POINTS);
  for(let theta = 0; theta < 180; theta += 2){
    for(let phy = 0; phy < 360; phy += 2){
      let x = r*(1+(sad-10)*sin(sad*theta)*sin(((sad*10)-40)*phy)) * sin(1*theta) * cos(phy);
      let y = r*(1+(sad-10)*sin(sad*theta)*sin(((sad*10)-40)*phy)) * sin(1*theta) * sin(phy);
      let z = r*(1+(sad-10)*sin(sad*theta)*sin(((sad*10)-40)*phy)) * cos(1*theta);
      vertex(x, y, z);
    }
  }
  endShape();
}
