import * as THREE from 'three';

export class GroupManager {
  private groups = new Map<string, THREE.Group>();

  createGroup(objects: THREE.Object3D[], name?: string): THREE.Group {
    const group = new THREE.Group();
    group.name = name || `Group_${Date.now()}`;
    
    objects.forEach(obj => {
      obj.parent?.remove(obj);
      group.add(obj);
    });

    this.groups.set(group.name, group);
    
    document.dispatchEvent(new CustomEvent('cad-group-created', { 
      detail: { group, objects } 
    }));
    
    return group;
  }

  ungroupObjects(group: THREE.Group): THREE.Object3D[] {
    const objects = group.children.slice();
    
    objects.forEach(obj => {
      group.remove(obj);
    });

    this.groups.delete(group.name);
    
    document.dispatchEvent(new CustomEvent('cad-group-ungrouped', { 
      detail: { group, objects } 
    }));
    
    return objects;
  }

  getGroup(name: string): THREE.Group | undefined {
    return this.groups.get(name);
  }

  getAllGroups(): THREE.Group[] {
    return Array.from(this.groups.values());
  }

  isGrouped(object: THREE.Object3D): boolean {
    return object.parent instanceof THREE.Group && this.groups.has(object.parent.name);
  }

  getObjectGroup(object: THREE.Object3D): THREE.Group | null {
    if (object.parent instanceof THREE.Group && this.groups.has(object.parent.name)) {
      return object.parent;
    }
    return null;
  }
}
