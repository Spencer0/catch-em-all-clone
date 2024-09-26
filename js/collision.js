 class CollisionManager {
     static checkCollision(entity, map) {
         for (let tile of map) {
             if (tile.type === 'water' &&
                 entity.x  tile.x + tile.width &&
                 entity.x + entity.width  tile.x &&
                 entity.y  tile.y + tile.height &&
                 entity.y + entity.height  tile.y) {
                 return true;
             }
         }
         return false;
     }
 }