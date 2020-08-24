import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ImageBlob } from './ImageBlob';

@Injectable({
  providedIn: 'root'
})
export class PostBlobsService {

  actionUrl: string;
  constructor(private http: HttpClient) { }

  /**
   * @param actionUrl is set to the blobuploadUrl where the user's image will be posted to
   * Fetch server to get blobUploadUrl and set actionUrl.
   * Called before user can see the form then displays form.
   */
  async fetchBlob(): Promise<void> {
    let response = await fetch('/blob-upload');
    let blobUploadUrl = await response.json();
    this.actionUrl = blobUploadUrl;

    console.log('actionURL: ' + this.actionUrl);
    console.log('upload ready');
  }

  /** 
   * Fetches the blobUploadURL to post image data to datastore
   */
  private onUpload(formData: FormData) {

    this.http.post<any>(this.actionUrl, formData).subscribe(
      (res) => console.log('SUCCESS: Image uploaded to server. ' + res),
      (err) => console.log('err ' + err)
    );
    console.log('SUCCESS: Image uploaded to server.');
    window.alert('Image was saved!');
  }

  /** 
   * Appends all vaulues to the form to be posted. Converts delete boolean to string
   */ 
  buildForm(formData: FormData, imageBlob: ImageBlob, fileName: string) {
    let deleteString: string;

    try {
      deleteString = imageBlob.delete.toString()
    }
    catch (error){
      console.log(imageBlob.delete + ' could not be converted into a string, returning \'false\'');
      deleteString = 'false';
    }
    //  Account for null tag value if user doesn't input tags.
    let tags = imageBlob.tags ? imageBlob.tags : '';

    formData.append('proj-id', imageBlob.projectId);
    formData.append('img-name',  imageBlob.imageName);
    formData.append('mode', imageBlob.mode);
    if (imageBlob.image) {
      formData.append('image', imageBlob.image, fileName);
    }
    formData.append('parent-img', imageBlob.parentImageName);
    formData.append('new-name', imageBlob.newImageName);
    formData.append('tags', tags);
    formData.append('delete', deleteString);

    console.log('formData:');
    console.log(formData);
    
    this.onUpload(formData);
  }
}
