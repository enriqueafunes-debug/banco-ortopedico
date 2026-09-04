package org.rotary.bancoortopedico;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.ContentValues;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.MediaStore;
import android.print.PrintAttributes;
import android.print.PrintManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

public class MainActivity extends Activity {
    private WebView webView;

    @SuppressLint({"SetJavaScriptEnabled","JavascriptInterface"})
    @Override public void onCreate(Bundle b){
        super.onCreate(b);
        webView=new WebView(this);
        setContentView(webView);
        WebSettings s=webView.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setAllowFileAccess(true);
        s.setAllowContentAccess(true);
        webView.addJavascriptInterface(new Bridge(),"Android");
        webView.setWebViewClient(new WebViewClient());
        webView.setWebChromeClient(new WebChromeClient());
        webView.loadUrl("file:///android_asset/index.html");
    }

    public class Bridge {
        @JavascriptInterface public void openWhatsApp(String phone,String message){
            runOnUiThread(()->{
                try{
                    String p=phone==null?"":phone.replaceAll("[^0-9]","");
                    while(p.startsWith("0")) p=p.substring(1);
                    if(p.startsWith("54")){
                        if(!p.startsWith("549")) p="549"+p.substring(2);
                    }else if(!p.startsWith("549")){
                        p="549"+p;
                    }
                    Uri uri=Uri.parse("https://wa.me/"+p+"?text="+Uri.encode(message));
                    startActivity(new Intent(Intent.ACTION_VIEW,uri));
                }catch(Exception e){
                    Toast.makeText(MainActivity.this,"No se pudo abrir WhatsApp",Toast.LENGTH_LONG).show();
                }
            });
        }

        @JavascriptInterface public void saveTextFile(String name,String content,String mime){
            try{
                byte[] bytes=content.getBytes(StandardCharsets.UTF_8);
                if(Build.VERSION.SDK_INT>=Build.VERSION_CODES.Q){
                    ContentValues values=new ContentValues();
                    values.put(MediaStore.Downloads.DISPLAY_NAME,name);
                    values.put(MediaStore.Downloads.MIME_TYPE,mime);
                    values.put(MediaStore.Downloads.RELATIVE_PATH,Environment.DIRECTORY_DOWNLOADS+"/Banco Ortopedico");
                    Uri uri=getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI,values);
                    if(uri==null) throw new Exception("No se pudo crear archivo");
                    try(OutputStream out=getContentResolver().openOutputStream(uri)){if(out==null)throw new Exception("Sin salida");out.write(bytes);}
                }else{
                    File dir=Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
                    if(!dir.exists())dir.mkdirs();
                    File f=new File(dir,name);
                    try(FileOutputStream out=new FileOutputStream(f)){out.write(bytes);}
                }
                runOnUiThread(()->Toast.makeText(MainActivity.this,"Guardado en Descargas: "+name,Toast.LENGTH_LONG).show());
            }catch(Exception e){
                runOnUiThread(()->Toast.makeText(MainActivity.this,"No se pudo guardar el archivo",Toast.LENGTH_LONG).show());
            }
        }

        @JavascriptInterface public void printPage(){
            runOnUiThread(()->{
                PrintManager pm=(PrintManager)getSystemService(PRINT_SERVICE);
                pm.print("Reporte Banco Ortopedico",webView.createPrintDocumentAdapter("Reporte Banco Ortopedico"),new PrintAttributes.Builder().build());
            });
        }
    }

    @Override public void onBackPressed(){
        if(webView!=null&&webView.canGoBack())webView.goBack();
        else super.onBackPressed();
    }
}
