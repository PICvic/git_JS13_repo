'use strict';

class Vector {
  constructor(x=0, y=0) {
      this.x = x;
      this.y = y;
  }

  plus (vector) {
    // Если передать аргумент другого типа, то
    //?? instanceof vs isPrototypeOf
    // конструктор - Object.create
    // if (vector instanceof Vector) {
    if (Vector.prototype.isPrototypeOf(vector)) {
      // Создает и возвращает новый объект типа Vector,
      // координаты которого будут суммой соответствующих координат суммируемых векторов.
      return new Vector(this.x + vector.x, this.y + vector.y);
    }
    // бросает исключение "Можно прибавлять к вектору только вектор типа Vector."
    throw new Error("Можно прибавлять к вектору только вектор типа Vector.");
  }

  times(n) {
    return new Vector(this.x*n, this.y*n);
  }
}

// С учетом проверочных данных считаем:
// позиция - координаты верхнего-левого угла объекта
// ось X направлена впрао (left < right)
// ось Y направлена вниз (bottom > top)

class Actor {
  // По умолчанию создается объект с координатами 0:0, размером 1x1 и скоростью 0:0.
  constructor(posVector = new Vector(0,0), sizeVector = new Vector(1,1), speedVector = new Vector(0,0)) {
    if (!Vector.prototype.isPrototypeOf(posVector)) {
      throw new Error("Можно только вектор типа Vector.");
    }
    if (!Vector.prototype.isPrototypeOf(sizeVector)) {
     throw new Error("Можно только вектор типа Vector. (второй аргумент Actor)");
    }
    if (!Vector.prototype.isPrototypeOf(speedVector)) {
      throw new Error("Можно только вектор типа Vector.");
    }

    this.pos = posVector;
    this.size = sizeVector;
    this.speed = speedVector;
    this.id = Math.random();
  }

  act(){};

  //Должны быть определены свойства только для чтения left, top, right, bottom,
  //в которых установлены границы объекта по осям X и Y с учетом его расположения и размера.
  get left() { return this.pos.x; }
  get top() { return this.pos.y; }
  get right() { return this.pos.x + this.size.x; }
  get bottom() { return this.pos.y + this.size.y; }


//2do Должен иметь свойство type — строку со значением actor, только для чтения.
  get type(){return "actor";}
  //Метод проверяет, пересекается ли текущий объект с переданным объектом
  //Принимает один аргумент — движущийся объект типа Actor.
  isIntersect(actor){
    //Если передать аргумент другого типа
    // или вызвать без аргументов, то метод бросает исключение.
    if (!Actor.prototype.isPrototypeOf(actor) || actor === undefined) {
        throw new Error("Требуется движущийся объект типа Actor.");
    }
    // Если передать в качестве аргумента этот же объект, то всегда возвращает false.
    if( this.id === actor.id) {
      return false;
    }
    // actor сильно левее / правее / ниже / выше this
    // Объекты, имеющие смежные границы, не пересекаются.
    if (actor.right <= this.left) {
      return false
    };
    if (actor.left >= this.right) {
      return false
    };
    if (actor.top >= this.bottom) {
      return false
    };
    if (actor.bottom <= this.top) {
      return false
    };
    // ВСЕ что не лежит за границами целиком - по определению пересекает!
    return true;
  }
}

class Level {
  // Принимает два аргумента: сетку игрового поля с препятствиями, массив массивов строк,
  // и список движущихся объектов, массив объектов Actor. Оба аргумента необязательные.
  constructor(grid, actors){
    // Набор по умолчанию (переопределяется дальше, нормальными входными данными)
    // if (grid[Y][X] === undefined){ ячейка пуста } else { "wall"..."lava" }
    this.grid = [[]];           // Имеет свойство grid — сетку игрового поля. Двумерный массив строк.
    this.height = 0;            // Имеет свойство height — высоту игрового поля,
    this.width = 0;             // Имеет свойство width — ширину игрового поля,
    this.actors = [];           // Имеет свойство actors — список движущихся объектов игрового поля, массив объектов Actor.
    this.player = undefined;    // Имеет свойство player — движущийся объект,
    this.status = null;         // Имеет свойство status — состояние прохождения уровня, равное null после создания.
    this.finishDelay = 1;       // Имеет свойство finishDelay — таймаут после окончания игры, равен 1 после создания.
    // провекри и переопределения
    // grid - двумерный массив, чтобы в дальнейшей работе не было ошибок TypeError при вызове grid[Y][X]
    if (Array.isArray(grid)) {
      let size = this.width;
      grid.forEach(function(item, index) {
        if (!Array.isArray(item)) {
          grid[index]=[];
        }
        // При этом, если в разных строках разное число ячеек, то width будет равно максимальному количеству ячеек в строке.
        if (item.length > size) {
          size = item.length;
        }
      });

      this.grid = grid;
      this.height = grid.length;      // равное числу строк в сетке из первого аргумента.
      this.width = size;              // равное числу ячеек в строке сетки из первого аргумента.
    }
    if (Array.isArray(actors)) {
      this.actors = actors;
      function isplayer(el) {                      // Игорок передаётся с остальными движущимися объектами.
        return el.type==="player";              // тип которого — свойство type — равно player.
      }
      this.player = actors.find(isplayer);
    }
  }

  isFinished(){
  // Определяет, завершен ли уровень. Не принимает аргументов.
    // Возвращает true, если свойство status не равно null и finishDelay меньше нуля.
    if (this.status !== null && this.finishDelay <0) {
      return true;
    }
    return false;
  }

  actorAt(actor){
  // Определяет, расположен ли какой-то другой движущийся объект в переданной позиции, и если да, вернёт этот объект.
  // Принимает один аргумент — движущийся объект, Actor.

    //Если не передать аргумент или передать не объект Actor, метод должен бросить исключение.
    if (actor === undefined || !Actor.prototype.isPrototypeOf(actor)) {
      throw new Error("Требуется движущийся объект типа Actor.");
    }
    // if (this.grid === [[]] || (this.height === 0 && this.width === 0))
    if (this.actors === []) {
      return undefined;
    }
    // Возвращает undefined, если переданный движущийся объект не пересекается ни с одним объектом на игровом поле.
    // Возвращает объект Actor, если переданный объект пересекается с ним на игровом поле. Если пересекается с несколькими объектами, вернет первый.
    return this.actors.find(function(actel) {
      return actor.isIntersect(actel);
    });
  }

  obstacleAt(vectormoveto, vectorsize) {
    // Аналогично методу actorAt определяет, нет ли препятствия в указанном месте. Также этот метод контролирует выход объекта за границы игрового поля.
    // метод принимает два аргумента:
      // положение, куда собираемся передвинуть объект, вектор Vector,
      // и размер этого объекта, тоже вектор Vector.

    //Если первым и вторым аргументом передать не Vector, то метод бросает исключение.
    if (!Vector.prototype.isPrototypeOf(vectormoveto)) {
      throw new Error("Можно только вектор типа Vector.");
    }
    if (!Vector.prototype.isPrototypeOf(vectorsize)) {
      throw new Error("Можно только вектор типа Vector.");
    }

    //Будем считать, что игровое поле слева, сверху и справа огорожено стеной и снизу у него смертельная лава.
    // Если описанная двумя векторами область выходит за пределы игрового поля,
    //то метод вернет строку lava, если область выступает снизу.
    if (vectormoveto.y+vectorsize.y > this.height) {
      return 'lava';
    }
    // И вернет wall в остальных случаях.
    if (vectormoveto.x+vectorsize.x > this.width || vectormoveto.x < 0 || vectormoveto.y < 0) {
      return 'wall';
    }

    // Вернет строку, соответствующую препятствию из сетки игрового поля, пересекающему область, описанную двумя переданными векторами,
    // либо undefined, если в этой области препятствий нет.

    // if (grid[Y][X] === undefined){ ячейка пуста } else { "wall"..."lava" }
    let xf = Math.floor(vectormoveto.x);
    let yf = Math.floor(vectormoveto.y);
    let xt = Math.ceil(vectormoveto.x+vectorsize.x);
    let yt = Math.ceil(vectormoveto.y+vectorsize.y);

    for (let y = yf; y<yt; y++) {
      for (let x =xf; x<xt; x++) {
        if (this.grid[y][x]) {
          if (this.grid[y][x]==='wall') {
            if (y === yt || x === xt) {
              continue;
            }
          }
          return this.grid[y][x];
        }
      }
    }
    return undefined;
  }

  removeActor(actor) {
    // Метод удаляет переданный объект с игрового поля. Если такого объекта на игровом поле нет, не делает ничего.
    // Принимает один аргумент, объект Actor. Находит и удаляет его.
    let index = this.actors.findIndex(function(el) { return el.id===actor.id;});
    this.actors.splice(index, 1);
  }

  noMoreActors(movobjType) {
    // Определяет, остались ли еще объекты переданного типа на игровом поле.
    // Принимает один аргумент — тип движущегося объекта, строка.
    return !this.actors.find(function(actel) { return movobjType===actel.type;});
  }

  playerTouched(objtype, movingobj) {
  // Меняет состояние игрового поля при касании игроком каких-либо объектов или препятствий.
  // Принимает два аргумента.
    // Тип препятствия или объекта, строка.
    // Движущийся объект, которого коснулся игрок, — объект типа Actor, необязательный аргумент.

    // Если состояние игры уже отлично от null, то не делаем ничего, игра уже и так завершилась.
    if (this.status === null) {
      // Если первым аргументом передать строку lava или fireball, то меняем статус игры на lost (свойство status).
      // Игрок проигрывает при касании лавы или шаровой молнии.
      if (objtype === "lava" || objtype === "fireball") {
        this.status = "lost";
      }

      // Если первым аргументом передать строку coin, а вторым — объект монеты, то необходимо удалить эту монету с игрового поля.
      if (objtype === "coin")
      {
        // удалить монету
        this.removeActor(movingobj);
        // Если при этом на игровом поле не осталось больше монет, то меняем статус игры на won.
        // Игрок побеждает, когда собирает все монеты на уровне.
        // Отсюда вытекает факт, что уровень без монет пройти невозможно.
        if (this.noMoreActors(objtype))
        {
          this.status = "won";
        }
      }

    }
  }

}

class LevelParser {
  constructor(dict) {
  // Принимает один аргумент — словарь движущихся объектов игрового поля, объект,
  //ключами которого являются символы из текстового представления уровня,
  //а значениями — конструкторы, с помощью которых можно создать новый объект.
    this.dict = dict;
  }

  actorFromSymbol(char) {
    // Принимает символ, строка.
    // Возвращает конструктор объекта по его символу, используя словарь.
    // Если в словаре не нашлось ключа с таким символом, вернет undefined.

    if (char === undefined) {
      return undefined;
    }
    return this.dict[char];
  }

  obstacleFromSymbol(char) {
    // Аналогично принимает символ, строка.
    // Возвращает строку, соответствующую символу препятствия.
    // Вернет wall, если передать x.
    // Вернет lava, если передать !.
    // Если символу нет соответствующего препятствия, то вернет undefined.
    // Вернет undefined, если передать любой другой символ.
    switch (char) {
      case "x": return "wall";
      case "!": return "lava";
      default: return undefined;
    }
  }

  createGrid(arr) {
    // Принимает массив строк и
    // преобразует его в массив массивов,
    // в ячейках которого хранится либо строка, соответствующая препятствию, либо undefined.
    // Движущиеся объекты не должны присутствовать на сетке.

    if (Array.isArray(arr) && arr.length===0) {
      return [];
    }

    let func = this.obstacleFromSymbol;

    let out = [];
    arr.forEach(function(line) {
      let innerarr = [];
      line.split("").forEach(function(el) {
        el = func(el);
        innerarr.push(el);
      });
      out.push(innerarr);
    });
    return out;
  }

  createActors(arr) {
    // Принимает массив строк и
    // преобразует его в массив движущихся объектов,
    // используя для их создания конструкторы из словаря.
    // Количество движущихся объектов в результирующем массиве должно быть равно количеству символов объектов в массиве строк.
    // Каждый объект должен быть создан с использованием вектора, определяющего его положение с учетом координат,
    // полученных на основе индекса строки в массиве (Y) и индекса символа в строке (X).
    // Для создания объекта должен быть использован конструктор из словаря, соответствующий символу.
    // При этом, если этот конструктор не является экземпляром Actor, то такой символ игнорируется, и объект не создается.

    let out = [];
    let func = this.actorFromSymbol;
    if (Array.isArray(arr) && arr.length===0) {
        return [];
    }

    if (this.dict === undefined) {
        return [];
    }

    for (let y=0; y<arr.length; y++) {
      let strarr = arr[y].split("");
      for (let x=0; x<strarr.length; x++) {
        let fres = this.actorFromSymbol( strarr[x] );
        if (fres !== undefined && typeof fres === 'function') {
          let tmp = new fres(new Vector(x,y));
          if (tmp instanceof Actor) {
            out.push( tmp );
          }
        }
      }
    }
    return out;
  }

  parse(arr) {
    // Принимает массив строк, создает и возвращает игровое поле, заполненное препятствиями и движущимися объектами, полученными на основе символов и словаря.
    return new Level(this.createGrid(arr), this.createActors(arr));
  }
}

// Класс Fireball станет прототипом для движущихся опасностей на игровом поле.
// Он должен наследовать весь функционал движущегося объекта Actor.
class Fireball extends Actor {
  // Принимает два аргумента: координаты, объект Vector и скорость, тоже объект Vector. Оба аргумента необязательные.
  // По умолчанию создается объект с координатами 0:0 и скоростью 0:0.
  constructor(posVector = new Vector(0,0), speedVector = new Vector(0,0)){
    super(posVector,undefined,speedVector);
    //Также должен иметь размер 1:1 в свойстве size, объект Vector.
      //значение по умолчанию в конструкторе Vector
  }

  // Созданный объект должен иметь свойство type со значением fireball. Это свойство только для чтения.
  get type(){return "fireball";}

  getNextPosition(time=1){
  // Принимает один аргумент, время, число. Аргумент необязательный, по умолчанию равен 1.
    // Создает и возвращает вектор Vector следующей позиции шаровой молнии.
    // новая позиция — это текущая позиция плюс скорость, умноженная на время. И так по каждой из осей.
    // return new Vector(this.pos.x+this.speed.x*time,this.pos.y+this.speed.y*time);
    return this.pos.plus(this.speed.times(time));
  }

  handleObstacle(){
  // Обрабатывает столкновение молнии с препятствием. Не принимает аргументов. Ничего не возвращает.
  // Меняет вектор скорости на противоположный. Если он был 5:5, то после должен стать -5:-5.
    this.speed.x *= -1;
    this.speed.y *= -1;
  }

  act(time, objLevel) {
  // Принимает два аргумента. Первый — время, число, второй — игровое поле, объект Level.

    // Получить следующую позицию, используя время.
    let nextPos = this.getNextPosition(time);

    // Выяснить, не пересечется ли в следующей позиции объект с каким-либо препятствием.
    let collisionWith = objLevel.obstacleAt(nextPos, this.size);
    // Пересечения с другими движущимися объектами учитывать не нужно.

    if (collisionWith === undefined) {
      // Если нет, обновить текущую позицию объекта.
      this.pos = nextPos;
    }
    else {
// Если объект пересекается с препятствием, то необходимо обработать это событие. При этом текущее положение остается прежним.
      this.handleObstacle();
    }
    // Метод ничего не возвращает.
  }
}

class HorizontalFireball extends Fireball{
// Он будет представлять собой объект, который
// движется по горизонтали со скоростью 2 и
// при столкновении с препятствием движется в обратную сторону.

  constructor(posVector){
  // Конструктор должен принимать один аргумент — координаты текущего положения, объект Vector.
  // И создавать объект размером 1:1 и скоростью, равной 2 по оси X.
    super(posVector);
    this.size = new Vector(1,1);
    this.speed = new Vector(2,0);
  }
}

class VerticalFireball extends Fireball {
// Он будет представлять собой объект, который
// движется по вертикали со скоростью 2 и
// при столкновении с препятствием движется в обратную сторону.

  constructor(posVector){
  // Конструктор должен принимать один аргумент — координаты текущего положения, объект Vector.
  // И создавать объект размером 1:1 и скоростью, равной 2 по оси Y.
    super(posVector);
    this.size = new Vector(1,1);
    this.speed = new Vector(0,2);
  }
}

class FireRain extends Fireball {
// Он будет представлять собой объект, который движется по вертикали со скоростью 3 и
// при столкновении с препятствием начинает движение в том же направлении из исходного положения, которое задано при создании.

  constructor(posVector) {
  // Конструктор должен принимать один аргумент — координаты текущего положения, объект Vector.
  // И создавать объект размером 1:1 и скоростью, равной 3 по оси Y.
    super(posVector);
    this.size = new Vector(1,1);
    this.speed = new Vector(0,3);

    this.startPos = posVector;
  }

  handleObstacle(){
    // при столкновении с препятствием начинает движение в том же направлении из исходного положения, которое задано при создании.
    this.pos = this.startPos;
  }
}

// Класс Coin реализует поведение монетки на игровом поле.
// Чтобы привлекать к себе внимание, монетки должны постоянно подпрыгивать в рамках своей ячейки.
// Класс должен наследовать весь функционал движущегося объекта Actor.
class Coin extends Actor {
  // Принимает один аргумент — координаты положения на игровом поле, объект Vector.
  constructor(posVector) {
    super(posVector);
    // А его реальные координаты должны отличаться от тех, что переданы в конструктор, на вектор 0,2:0,1.
    this.pos = this.pos.plus(new Vector(0.2,0.1));
    // Созданный объект должен иметь размер 0,6:0,6.
    this.size = new Vector(0.6,0.6);
    // Также объект должен иметь следующие свойства:
    //     Скорость подпрыгивания, springSpeed, равная 8;
    this.springSpeed = 8;
    //     Радиус подпрыгивания, springDist, равен 0.07;
    this.springDist = 0.07;
    //     Фаза подпрыгивания, spring, случайное число от 0 до 2π.
    this.spring = Math.random()*2*Math.PI; // A floating-point, pseudo-random number between 0 (inclusive) and 1 (exclusive).
    this.basepos = this.pos;
  }

  // Свойство type созданного объекта должно иметь значение coin.
  get type(){return "coin";}

  updateSpring(time = 1) {
    // Принимает один аргумент — время, число, по умолчанию 1.
    // Обновляет текущую фазу spring, увеличив её на скорость springSpeed, умноженную на время.
    this.spring += this.springSpeed*time;
    // Ничего не возвращает.
  }

  getSpringVector() {
    // Не принимает аргументов.
    // Создает и возвращает вектор подпрыгивания.
    // Так как подпрыгивание происходит только по оси Y, то координата X вектора всегда равна нулю.
    // Координата Y вектора равна синусу текущей фазы, умноженному на ___радиус___. (springDist по тестам)
    return new Vector(0, Math.sin(this.spring)*this.springDist);
  }

  getNextPosition(time=1) {
    // Принимает один аргумент — время, число, по умолчанию 1.
    // Обновляет текущую фазу,
    this.updateSpring(time);
    // создает и возвращает вектор новой позиции монетки.

    // Новый вектор равен базовому вектору положения, увеличенному на вектор подпрыгивания.
    // Увеличивать нужно именно базовый вектор положения, который получен в конструкторе, а не текущий.
    let pos = this.basepos.plus(this.getSpringVector());
    return new Vector(pos.x, pos.y);
  }

  act(time) {
    // Принимает один аргумент — время.
    // Получает новую позицию объекта и
    // задает её как текущую.
    this.pos = this.getNextPosition(time);
    // Ничего не возвращает.
  }
}

//------------------------------------------------------------------------------

class Player extends Actor {
// Класс Player содержит базовый функционал движущегося объекта, который представляет игрока на игровом поле. Должен наследовать возможности Actor.
  constructor(posVector) {
  // Принимает один аргумент — координаты положения на игровом поле, объект Vector.
  // реальное положение которого отличается от того, что передано в конструктор, на вектор 0:-0,5. Имеет размер 0,8:1,5. И скорость 0:0.
    super(posVector);
    this.pos = this.pos.plus(new Vector(0,-0.5));
    this.size = new Vector(0.8,1.5); //0.8,1.5
    this.speed = new Vector(0,0);
  }

  // Имеет свойство type, равное player.
  get type(){return "player";}
}

const schemas = [
  // [
  //   'oooooooooooooooo ooooooooooooooo',
  //   'oooooooooooooooo@ooooooooooooooo',
  //   'oooooooooooooooo ooooooooooooooo',
  //   'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
  // ],
  [
    '          ol       ',
    '@o                ',
    ' o       x        ',
    'xx               x',
    ' x     xxxxx     x ',
    '  x      o      x',
    '   x           x  ',
    '    x      l  x   ',
    '     x       x    ',
    '      x     x    ',
    '       xx xx   x',
    'xx xx     '
  ],
  [
    '      vlvv',
    '         ',
    '   ==    ',
    '         ',
    '         ',
    '         ',
    '    !xxxo ',
    '    =   x',
    '         ',
    '  oo@oooo',
    '           = x',
    '  xxxxxxxxxxx',
    '         ',
    '         ',
    '  x  x    ',
    'xx xx     '
  ],
  [
    '      v  ',
    '    v    ',
    '  v      ',
    '        o',
    '        x',
    '@   x    ',
    'x        ',
    '         '
  ]
];
const actorDict = {
  '@': Player,
  'v': FireRain,
  'o': Coin,
  '=': HorizontalFireball,
  'l': VerticalFireball
}
const parser = new LevelParser(actorDict);
runGame(schemas, parser, DOMDisplay)
  .then(() => alert('Вы выиграли приз!'));


