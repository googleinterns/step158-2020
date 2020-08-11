import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

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
    console.log('blob upload url: ' + blobUploadUrl);
    this.actionUrl = blobUploadUrl;
   // this.displayUpload = true;
    console.log('actionURL: ' + this.actionUrl);
    console.log('upload ready');
  }

  /** 
   * Fetches the blobUploadURL to post image data to datastore
   */
  onUpload(formData: FormData, uploadForm) {

    this.http.post<any>(this.actionUrl, formData).subscribe(
      (res) => console.log('res ' + res),
      (err) => console.log('err ' + err)
    );
    console.log('SUCCESS: Image uploaded to server.');

    // Reset form values, object passed by Ref.
    uploadForm.reset();
  }

  // /** 
  //  *  @returns the URL for the image/mask to be posted to. 
  //  */
  // getActionUrl(): string {
  //   return this.actionUrl;
  // }
}