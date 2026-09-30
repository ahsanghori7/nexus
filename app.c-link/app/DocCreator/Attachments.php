<?php
namespace App\DocCreator;

use setasign\Fpdi\Fpdi;

/*
 * http://www.fpdf.org/en/script/script95.php
 */
class Attachments extends Fpdi
{
    protected $files = array();
    protected $n_files;
    protected $open_attachment_pane = false;

    function Attach($file, $name='', $desc='')
    {
        if($name=='')
        {
            $p = strrpos($file,'/');
            if($p===false)
                $p = strrpos($file,'\\');
            if($p!==false)
                $name = substr($file,$p+1);
            else
                $name = $file;
        }
        $this->files[] = array('file'=>$file, 'name'=>$name, 'desc'=>$desc);
    }

    function OpenAttachmentPane()
    {
        $this->open_attachment_pane = true;
    }

    function _putfiles()
    {
        foreach($this->files as $i=>&$info)
        {
            $file = $info['file'];
            $name = $info['name'];
            $desc = $info['desc'];

            $fc = file_get_contents($file);
            if($fc===false)
                $this->Error('Cannot open file: '.$file);
            $size = strlen($fc);
            $date = @date('YmdHisO', filemtime($file));
            $md = 'D:'.substr($date,0,-2)."'".substr($date,-2)."'";;

            $this->_newobj();
            $info['n'] = $this->n;
            $this->_put('<<');
            $this->_put('/Type /Filespec');
            $this->_put('/F ('.$this->_escape($name).')');
            $this->_put('/UF '.$this->_textstring($name));
            $this->_put('/EF <</F '.($this->n+1).' 0 R>>');
            if($desc)
                $this->_put('/Desc '.$this->_textstring($desc));
            $this->_put('/AFRelationship /Unspecified');
            $this->_put('>>');
            $this->_put('endobj');

            $this->_newobj();
            $this->_put('<<');
            $this->_put('/Type /EmbeddedFile');
            $this->_put('/Subtype /application#2Foctet-stream');
            $this->_put('/Length '.$size);
            $this->_put('/Params <</Size '.$size.' /ModDate '.$this->_textstring($md).'>>');
            $this->_put('>>');
            $this->_putstream($fc);
            $this->_put('endobj');
        }
        unset($info);

        $this->_newobj();
        $this->n_files = $this->n;
        $a = array();
        foreach($this->files as $i=>$info)
            $a[] = $this->_textstring(sprintf('%03d',$i)).' '.$info['n'].' 0 R';
        $this->_put('<<');
        $this->_put('/Names ['.implode(' ',$a).']');
        $this->_put('>>');
        $this->_put('endobj');
    }

    function _putresources()
    {
        parent::_putresources();
        if(!empty($this->files))
            $this->_putfiles();
    }

    function _putcatalog()
    {
        parent::_putcatalog();
        if(!empty($this->files))
        {
            $this->_put('/Names <</EmbeddedFiles '.$this->n_files.' 0 R>>');
            $a = array();
            foreach($this->files as $info)
                $a[] = $info['n'].' 0 R';
            $this->_put('/AF ['.implode(' ',$a).']');
            if($this->open_attachment_pane)
                $this->_put('/PageMode /UseAttachments');
        }
    }
}
